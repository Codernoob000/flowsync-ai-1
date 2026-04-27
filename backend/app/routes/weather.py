from fastapi import APIRouter
from app.services.weather_svc import fetch_weather

router = APIRouter()

@router.get("/{city}")
async def get_weather(city: str):
    return await fetch_weather(city)

@router.get("/both/{origin}/{destination}")
async def get_both(origin: str, destination: str):
    """Fetch weather for origin and destination in one call."""
    o = await fetch_weather(origin)
    d = await fetch_weather(destination)
    return {"origin": o, "destination": d}
