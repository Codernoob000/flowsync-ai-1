from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import RouteRequest
from app.services.route_svc import get_routes
from app.services.ai_engine import evaluate_routes
from app.services.weather_svc import fetch_weather
import datetime
import traceback

router = APIRouter()


def _get_time_of_day():
    hour = datetime.datetime.now().hour
    if hour < 12:
        return "morning"
    elif hour < 18:
        return "afternoon"
    return "night"


@router.post("/best-route")
async def best_route(req: RouteRequest):
    try:
        # 1. Get routes
        routes_data = await get_routes(
            req.origin, req.destination,
            req.origin_lat, req.origin_lng,
            req.dest_lat, req.dest_lng
        )

        routes = routes_data.get("routes", routes_data) if isinstance(routes_data, dict) else routes_data

        if not routes or not isinstance(routes, list):
            return {"error": "No routes found"}

        # 2. Weather
        weather_data = await fetch_weather(req.destination)
        live_weather = (weather_data or {}).get("condition", "clear").lower()

        # 3. Dynamic time of day
        tod = _get_time_of_day()

        # 4. AI input
        ai_routes = []
        for r in routes:
            ai_routes.append({
                "traffic": r.get("traffic_level", "medium"),
                "weather": live_weather,
                "distance": r.get("distance_km", 10),
                "time_of_day": tod
            })

        # 5. AI evaluation
        ai_result = evaluate_routes(ai_routes)

        # 6. Attach original routes
        for i, res in enumerate(ai_result["all_routes"]):
            if i < len(routes):
                res["original_route"] = routes[i]

        best_index = ai_result["all_routes"].index(ai_result["best_route"])
        if best_index < len(routes):
            ai_result["best_route"]["original_route"] = routes[best_index]

        return ai_result

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e), "detail": "Route analysis failed"}


# ── Predict endpoint (simplified interface) ──
class PredictRequest(BaseModel):
    traffic: str = "medium"
    weather: str = "clear"
    distance: float = 10.0
    time_of_day: Optional[str] = None


@router.post("/predict")
async def predict(req: PredictRequest):
    tod = req.time_of_day or _get_time_of_day()
    route_data = {
        "traffic": req.traffic,
        "weather": req.weather,
        "distance": req.distance,
        "time_of_day": tod
    }
    result = evaluate_routes([route_data])
    best = result["best_route"]
    return {
        "risk_score": best["probability"],
        "risk_label": best["risk"],
        "action": best["action"],
        "explanation": best["explanation"],
        "score": best["score"]
    }


@router.get("/demo")
async def demo():
    return await get_routes(
        "Mumbai", "Hyderabad",
        19.0760, 72.8777,
        17.3850, 78.4867
    )