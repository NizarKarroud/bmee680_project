from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class AirQuality(str, Enum):
    GOOD     = "GOOD"
    MODERATE = "MODERATE"
    POOR     = "POOR"


class ResetReason(str, Enum):
    MANUAL    = "MANUAL"
    SCHEDULED = "SCHEDULED"
    ERROR     = "ERROR"


# ── Sensor reading (ce que le STM32 envoie via POST) ─────────────────────────

class SensorReading(BaseModel):
    temperature:    float = Field(..., ge=-40,  le=85,      description="°C")
    humidity:       float = Field(..., ge=0,    le=100,     description="%")
    pressure:       float = Field(..., ge=300,  le=1100,    description="hPa")
    gas_resistance: float = Field(..., ge=0,               description="Ohms")
    timestamp:      Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


# ── Modèle base de données (ce qui est stocké) ───────────────────────────────

class SensorRecord(SensorReading):
    id:          int
    air_quality: AirQuality
    node_id:     str = Field(default="BME680-01")

    class Config:
        from_attributes = True   


# ── Réponse à /sensor/data/fetch ─────────────────────────────────────────────

class SensorDataResponse(BaseModel):
    latest:  Optional[SensorRecord]
    history: list[SensorRecord]
    total:   int


# ── Réponse à /sensor/reset ──────────────────────────────────────────────────

class ResetRequest(BaseModel):
    reason:  ResetReason = ResetReason.MANUAL
    node_id: str         = Field(default="BME680-01")


class ResetResponse(BaseModel):
    success:    bool
    reset_at:   datetime
    reason:     ResetReason
    node_id:    str


# ── Réponse à /sensor/data/export ────────────────────────────────────────────

class ExportFormat(str, Enum):
    CSV  = "csv"
    JSON = "json"


class ExportRequest(BaseModel):
    format:     ExportFormat = ExportFormat.CSV
    date_from:  Optional[datetime] = None
    date_to:    Optional[datetime] = None
    node_id:    Optional[str]      = None


class ExportResponse(BaseModel):
    format:      ExportFormat
    record_count: int
    file_url:    str            
    generated_at: datetime



class BaselineStatus(str, Enum):
    CALIBRATING = "CALIBRATING"   
    READY       = "READY"        

class GasBaseline(BaseModel):
    """Stockée en DB, une seule ligne par node."""
    id:              int
    node_id:         str
    baseline_value:  float             
    sample_count:    int              
    status:          BaselineStatus
    last_updated:    datetime

    class Config:
        from_attributes = True