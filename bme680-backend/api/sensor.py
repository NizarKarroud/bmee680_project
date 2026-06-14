import csv
import json
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.db import get_db
from database.sensor import SensorRecordORM, GasBaselineORM
from schemas.sensor import (
    SensorReading, SensorRecord, SensorDataResponse,
    ResetRequest, ResetResponse,
    ExportFormat,
    AirQuality, BaselineStatus, GasBaseline,
)
from calc.air_quality import update_baseline_online, classify_air_quality, MIN_SAMPLES_FOR_READY

router = APIRouter(prefix="/sensor", tags=["sensor"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_or_create_baseline(db: Session, node_id: str) -> GasBaselineORM:
    baseline = db.query(GasBaselineORM).filter(
        GasBaselineORM.node_id == node_id
    ).first()
    if not baseline:
        baseline = GasBaselineORM(node_id=node_id)
        db.add(baseline)
        db.commit()
        db.refresh(baseline)
    return baseline


def _orm_to_schema(record: SensorRecordORM) -> SensorRecord:
    return SensorRecord(
        id=record.id,
        temperature=record.temperature,
        humidity=record.humidity,
        pressure=record.pressure,
        gas_resistance=record.gas_resistance,
        air_quality=record.air_quality,
        node_id=record.node_id,
        timestamp=record.timestamp,
    )


# ── POST /sensor/data/ingest ──────────────────────────────────────────────────

@router.post("/data/ingest", response_model=SensorRecord)
async def ingest_data(reading: SensorReading, db: Session = Depends(get_db)):

    node_id  = "BME680-01"
    baseline = _get_or_create_baseline(db, node_id)

    # ── O(1) : pas de requête historique ─────────────────────────
    new_baseline_value = update_baseline_online(baseline, reading.gas_resistance)

    air_quality = classify_air_quality(
        reading.gas_resistance,
        new_baseline_value,
        baseline.sample_count,
    )

    # ── Persist reading ───────────────────────────────────────────
    record = SensorRecordORM(
        temperature    = reading.temperature,
        humidity       = reading.humidity,
        pressure       = reading.pressure,
        gas_resistance = reading.gas_resistance,
        air_quality    = air_quality,
        node_id        = node_id,
        timestamp      = reading.timestamp or datetime.now(timezone.utc),
    )
    db.add(record)

    baseline.status      = BaselineStatus.READY if baseline.sample_count >= MIN_SAMPLES_FOR_READY else BaselineStatus.CALIBRATING
    baseline.last_updated = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)
    return _orm_to_schema(record)

# ── GET /sensor/data/fetch ────────────────────────────────────────────────────

@router.get("/data/fetch", response_model=SensorDataResponse)
async def fetch_data(
    limit:   int = Query(default=40, ge=1, le=500),
    node_id: str = Query(default="BME680-01"),
    db: Session  = Depends(get_db),
):
    """Called by the React frontend to get the latest readings."""

    query = (
        db.query(SensorRecordORM)
        .filter(SensorRecordORM.node_id == node_id)
        .order_by(desc(SensorRecordORM.timestamp))
    )

    total   = query.count()
    records = query.limit(limit).all()
    history = [_orm_to_schema(r) for r in records]
    latest  = history[0] if history else None

    return SensorDataResponse(latest=latest, history=history, total=total)


# ── POST /sensor/reset ────────────────────────────────────────────────────────

@router.post("/reset", response_model=ResetResponse)
async def reset_sensor(body: ResetRequest, db: Session = Depends(get_db)):
    """
    Reset the gas baseline so calibration restarts from scratch.
    Historical records are kept — the baseline is just recomputed from zero.
    """
    baseline = _get_or_create_baseline(db, body.node_id)
    baseline.baseline_value = 0.0
    baseline.sample_count   = 0
    baseline.status         = BaselineStatus.CALIBRATING
    baseline.last_updated   = datetime.now(timezone.utc)
    db.commit()

    return ResetResponse(
        success  = True,
        reset_at = datetime.now(timezone.utc),
        reason   = body.reason,
        node_id  = body.node_id,
    )


# ── GET /sensor/data/export ───────────────────────────────────────────────────

@router.get("/data/export")
async def export_data(
    format:    ExportFormat = Query(default=ExportFormat.CSV),
    date_from: str | None   = Query(default=None),
    date_to:   str | None   = Query(default=None),
    node_id:   str | None   = Query(default=None),
    db: Session = Depends(get_db),
):
    """Export historical sensor data as CSV or JSON."""

    query = db.query(SensorRecordORM).order_by(SensorRecordORM.timestamp)

    if node_id:
        query = query.filter(SensorRecordORM.node_id == node_id)
    if date_from:
        try:
            query = query.filter(SensorRecordORM.timestamp >= datetime.fromisoformat(date_from))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date_from — use ISO 8601.")
    if date_to:
        try:
            query = query.filter(SensorRecordORM.timestamp <= datetime.fromisoformat(date_to))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date_to — use ISO 8601.")

    records = query.all()

    if format == ExportFormat.CSV:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "node_id", "timestamp",
            "temperature", "humidity", "pressure",
            "gas_resistance", "air_quality",
        ])
        for r in records:
            writer.writerow([
                r.id, r.node_id,
                r.timestamp.isoformat() if r.timestamp else "",
                r.temperature, r.humidity, r.pressure,
                r.gas_resistance, r.air_quality.value,
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=sensor_export.csv"},
        )

    else:
        data = [
            {
                "id":             r.id,
                "node_id":        r.node_id,
                "timestamp":      r.timestamp.isoformat() if r.timestamp else None,
                "temperature":    r.temperature,
                "humidity":       r.humidity,
                "pressure":       r.pressure,
                "gas_resistance": r.gas_resistance,
                "air_quality":    r.air_quality.value,
            }
            for r in records
        ]
        return StreamingResponse(
            iter([json.dumps(data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=sensor_export.json"},
        )


# ── GET /sensor/baseline ──────────────────────────────────────────────────────

@router.get("/baseline", response_model=GasBaseline)
async def get_baseline(
    node_id: str = Query(default="BME680-01"),
    db: Session  = Depends(get_db),
):
    """Current baseline status — useful for the dashboard calibration indicator."""
    baseline = _get_or_create_baseline(db, node_id)
    return GasBaseline(
        id             = baseline.id,
        node_id        = baseline.node_id,
        baseline_value = baseline.baseline_value,
        sample_count   = baseline.sample_count,
        status         = baseline.status,
        last_updated   = baseline.last_updated,
    )