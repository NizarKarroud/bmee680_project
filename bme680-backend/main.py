from fastapi import FastAPI
from database.db import init_db
from api.router import v1_router
from serial_reader import start_serial_reader
from contextlib import asynccontextmanager

app = FastAPI(title="BME680 Sensor API", version="1.0.0")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_serial_reader()
    yield

app = FastAPI(title="BME680 Sensor API", version="1.0.0", lifespan=lifespan)

app.include_router(v1_router)

@app.get("/health")
def health():
    return {"status": "ok"}