from fastapi import APIRouter
from api import sensor
v1_router = APIRouter()
v1_router.include_router(sensor.router, tags=["sensor"])

