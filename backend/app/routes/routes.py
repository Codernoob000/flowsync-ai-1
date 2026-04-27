from fastapi import APIRouter
from app.models.schemas import RouteRequest
from app.services.route_svc import get_routes
from app.services.ai_engine import evaluate_routes
from app.services.weather_svc import fetch_weather
from datetime import datetime

router = APIRouter()


@router.post("/best-route")
async def best_route(req: RouteRequest):

    # Step 1: Get routes
    routes_data = get_routes(
        req.origin, req.destination,
        req.origin_lat, req.origin_lng,
        req.dest_lat, req.dest_lng
    )

    # Step 2: Extract routes safely
    if isinstance(routes_data, dict):
        routes = routes_data.get("routes", [])
    else:
        routes = routes_data

    if not routes or not isinstance(routes, list):
        return {"error": "No routes found"}

    # Step 3: Get live weather (safe fallback)
    try:
        weather_data = await fetch_weather(req.destination)
        live_weather = (weather_data or {}).get("condition", "clear").lower()
    except Exception:
        live_weather = "clear"

    # Step 4: Dynamic time of day
    hour = datetime.now().hour
    if 6 <= hour < 12:
        time_of_day = "morning"
    elif 12 <= hour < 18:
        time_of_day = "afternoon"
    elif 18 <= hour < 22:
        time_of_day = "evening"
    else:
        time_of_day = "night"

    # Step 5: Prepare AI inputs
    risk_map = {
        "low": "low",
        "medium": "medium",
        "high": "high"
    }

    ai_routes = []
    for r in routes:
        ai_routes.append({
            "traffic": risk_map.get(str(r.get("risk_level", "medium")).lower(), "medium"),
            "weather": live_weather,
            "distance": r.get("distance_km", 10),
            "time_of_day": time_of_day
        })

    # Step 6: Evaluate routes using AI
    ai_result = evaluate_routes(ai_routes)

    # Step 7: Attach original route data
    for i, res in enumerate(ai_result.get("all_routes", [])):
        if i < len(routes):
            res["original_route"] = routes[i]

    # Attach original route to best route safely
    try:
        best_index = ai_result["all_routes"].index(ai_result["best_route"])
        ai_result["best_route"]["original_route"] = routes[best_index]
    except Exception:
        pass

    return ai_result


@router.get("/demo")
def demo():
    """Ready-made Mumbai → Hyderabad demo route."""
    return get_routes(
        "Mumbai", "Hyderabad",
        19.0760, 72.8777,
        17.3850, 78.4867
    )