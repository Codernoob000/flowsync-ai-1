def get_routes(origin: str, dest: str, olat: float, olng: float, dlat: float, dlng: float):
    # Mock data based on the requirements
    return {
        "routes": [
            {
                "route_id": "route_1",
                "label": "Main Highway",
                "distance_km": 15.5,
                "duration_minutes": 30,
                "risk_level": "low",
                "time_of_day": "afternoon",
                "waypoints": [[olat, olng], [dlat, dlng]]
            },
            {
                "route_id": "route_2",
                "label": "City Streets",
                "distance_km": 12.0,
                "duration_minutes": 45,
                "risk_level": "high",
                "time_of_day": "afternoon",
                "waypoints": [[olat, olng], [dlat, dlng]]
            },
            {
                "route_id": "route_3",
                "label": "Scenic Bypass",
                "distance_km": 20.0,
                "duration_minutes": 35,
                "risk_level": "medium",
                "time_of_day": "afternoon",
                "waypoints": [[olat, olng], [dlat, dlng]]
            }
        ]
    }
