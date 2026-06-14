from sqlalchemy import Column, Integer, Float, String, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from database.db import Base
from schemas.sensor import AirQuality, BaselineStatus


class SensorRecordORM(Base):
    __tablename__ = "sensor_records"

    id             = Column(Integer, primary_key=True, index=True)
    temperature    = Column(Float, nullable=False)
    humidity       = Column(Float, nullable=False)
    pressure       = Column(Float, nullable=False)
    gas_resistance = Column(Float, nullable=False)
    air_quality    = Column(SAEnum(AirQuality), nullable=False)
    node_id        = Column(String, nullable=False, default="BME680-01", index=True)
    timestamp      = Column(DateTime(timezone=True), server_default=func.now())


class GasBaselineORM(Base):
    __tablename__ = "gas_baselines"

    id             = Column(Integer, primary_key=True, index=True)
    baseline_value = Column(Float, nullable=False, default=0.0)
    sample_count   = Column(Integer, nullable=False, default=0)
    status         = Column(SAEnum(BaselineStatus), nullable=False, default=BaselineStatus.CALIBRATING)
    last_updated   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    running_max  = Column(Float, nullable=False, default=0.0)
    running_mean = Column(Float, nullable=False, default=0.0)
    running_m2   = Column(Float, nullable=False, default=0.0)
    node_id = Column(String, nullable=False, unique=True, index=True)
