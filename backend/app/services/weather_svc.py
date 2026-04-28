import httpx
import os
import random

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

SEVERITY = {
    "Clear": 0.05, "Clouds": 0.15, "Drizzle": 0.30,
    "Rain": 0.55,  "Thunderstorm": 0.85, "Snow": 0.75,
    "Mist": 0.25,  "Fog": 0.40,  "Haze": 0.20,
}

async def fetch_weather(city: str) -> dict:
    API_KEY = os.getenv("OPENWEATHER_API_KEY")

    print("WEATHER API KEY:", "loaded" if API_KEY else "MISSING")  # safe check

    if not API_KEY:
        print("❌ No API key found")
        return _mock(city)

    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(
                BASE_URL,
                params={
                    "q": city,
                    "appid": API_KEY,
                    "units": "metric"
                }
            )

            print("STATUS CODE:", r.status_code)  # ✅ check API response

            r.raise_for_status()
            d = r.json()

            cond = d["weather"][0]["main"]

            return {
                "city": city,
                "condition": cond,
                "description": d["weather"][0]["description"],
                "temperature_c": d["main"]["temp"],
                "humidity": d["main"]["humidity"],
                "wind_speed_ms": d["wind"]["speed"],
                "severity": SEVERITY.get(cond, 0.3),
                "source": "live"
            }

    except Exception as e:
        print("❌ ERROR:", str(e))  # ✅ THIS IS THE REAL ISSUE
        return _mock(city)

def _mock(city: str) -> dict:
    cond = random.choice(["Clear", "Clouds", "Rain", "Thunderstorm", "Drizzle"])
    return {
        "city": city,
        "condition": cond,
        "description": cond.lower(),
        "temperature_c": round(random.uniform(20, 38), 1),
        "humidity": random.randint(40, 90),
        "wind_speed_ms": round(random.uniform(2, 14), 1),
        "severity": SEVERITY.get(cond, 0.3),
        "source": "mock"
    }