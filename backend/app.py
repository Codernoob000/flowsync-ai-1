from fastapi import FastAPI
import pickle
import pandas as pd
from typing import List, Dict
import os
import traceback
import concurrent.futures
from dotenv import load_dotenv
from google import genai

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

# -----------------------------
# Configure Gemini
# -----------------------------
client = genai.Client(api_key=API_KEY)

# -----------------------------
# Load ML Model
# -----------------------------
BASE_DIR = os.path.dirname(__file__)
model_path = os.path.join(BASE_DIR, "model.pkl")

if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found at {model_path}")

with open(model_path, "rb") as f:
    model = pickle.load(f)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

# -----------------------------
# Gemini Helper (Safe + Timeout)
# -----------------------------
def fetch_gemini(prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()

def gemini_explain(prompt):
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(fetch_gemini, prompt)
            text = future.result(timeout=10.0)
            return text[:250] + "..." if len(text) > 250 else text
    except concurrent.futures.TimeoutError:
        return "AI explanation unavailable (timeout)."
    except Exception:
        return "AI explanation unavailable."

# -----------------------------
# Risk Calculation
# -----------------------------
def get_risk(probability):
    if probability < 0.35:
        return "Low"
    elif probability < 0.75:
        return "Medium"
    else:
        return "High"

# -----------------------------
# Explanation Logic
# -----------------------------
def explain(data, risk):
    reasons = []

    if data.get("traffic") == "high":
        reasons.append("heavy traffic")
    elif data.get("traffic") == "medium":
        reasons.append("moderate traffic")

    if data.get("weather") in ["rain", "storm", "foggy"]:
        reasons.append("adverse weather conditions")

    if data.get("time_of_day") in ["evening", "night"]:
        reasons.append("peak hour timing")

    if not reasons:
        return "Low delay risk, favorable conditions"

    if risk == "High":
        return "High delay risk due to " + ", ".join(reasons)
    elif risk == "Medium":
        return "Moderate delay risk due to " + ", ".join(reasons)
    else:
        return "Low delay risk with minor influencing factors"

# -----------------------------
# Route Scoring (FINAL)
# -----------------------------
def route_score(distance, risk, probability):
    weight = {"Low": 1, "Medium": 15, "High": 50}
    return distance + weight[risk] + (probability * 10)

# -----------------------------
# Prepare Input
# -----------------------------
def prepare_input(data):
    df = pd.DataFrame([data])
    df = pd.get_dummies(df)

    model_columns = model.feature_names_in_

    for col in model_columns:
        if col not in df:
            df[col] = 0

    return df[model_columns]

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def home():
    return {"message": "🚀 FlowSync AI is running"}

# -----------------------------
# Predict Endpoint
# -----------------------------
@app.post("/predict")
def predict(data: dict):

    required_fields = ["traffic", "weather", "distance", "time_of_day"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing field: {field}"}

    try:
        df = prepare_input(data)

        prediction = model.predict(df)[0]
        probability = model.predict_proba(df)[0][1]

        risk = get_risk(probability)
        explanation = explain(data, risk)

        prompt = f"""
Explain briefly why delay risk is {risk}.

Traffic: {data['traffic']}
Weather: {data['weather']}
Time: {data['time_of_day']}
Distance: {data['distance']}
"""
        ai_explanation = gemini_explain(prompt)

        if risk == "High":
            action = "Reroute immediately"
        elif risk == "Medium":
            action = "Proceed with caution"
        else:
            action = "Proceed normally"

        if probability < 0.2 or probability > 0.8:
            confidence = "High"
        elif probability < 0.4 or probability > 0.6:
            confidence = "Medium"
        else:
            confidence = "Low"

        return {
            "prediction": int(prediction),
            "probability": round(float(probability), 2),
            "risk": risk,
            "confidence": confidence,
            "explanation": explanation,
            "ai_explanation": ai_explanation,
            "action": action
        }

    except Exception:
        traceback.print_exc()
        return {"error": "Internal server error"}

# -----------------------------
# Best Route Endpoint (FIXED)
# -----------------------------
@app.post("/best-route")
def best_route(routes: List[Dict]):

    results = []

    try:
        for route in routes:
            df = prepare_input(route)

            probability = model.predict_proba(df)[0][1]
            risk = get_risk(probability)

            # 🔥 SAFETY OVERRIDES FIRST
            if route["weather"] == "storm":
                risk = "High"
            elif route["traffic"] == "high" and route["weather"] == "rain":
                risk = "High"
            elif route["traffic"] == "low" and route["weather"] == "clear":
                risk = "Low"

            # 🔥 SCORE AFTER FINAL RISK
            score = route_score(route["distance"], risk, probability)

            prompt = f"""
Explain briefly if this route is good or bad.

Traffic: {route['traffic']}
Weather: {route['weather']}
Distance: {route['distance']}
Time: {route['time_of_day']}
"""
            ai_explanation = gemini_explain(prompt)

            if "unavailable" in ai_explanation:
                ai_explanation = explain(route, risk)

            if risk == "High":
                action = "Avoid route"
            elif risk == "Medium":
                action = "Use with caution"
            else:
                action = "Safe route"

            results.append({
                "route": route,
                "risk": risk,
                "score": round(score, 2),
                "probability": round(float(probability), 2),
                "explanation": explain(route, risk),
                "ai_explanation": ai_explanation,
                "action": action
            })

        # 🔥 PRIORITIZE SAFETY FIRST
        risk_priority = {"Low": 0, "Medium": 1, "High": 2}
        best = min(results, key=lambda x: (risk_priority[x["risk"]], x["score"]))
        all_high = all(r["risk"] == "High" for r in results)

        if all_high:
            decision_reason = "All routes are high risk. Selected the least risky option, but delay is unavoidable."
        else:
            decision_reason = "Selected route balances lowest risk and optimal distance for safe delivery"

        return {
            "all_routes": results,
            "best_route": best,
            "decision_reason":  decision_reason
        }

    except Exception:
        return {"error": "Internal server error"}

# -----------------------------
# Simulation Endpoint
# -----------------------------
@app.post("/simulate")
def simulate(data: dict):

    if "weather" not in data:
        return {"error": "Missing field: weather"}

    try:
        original_weather = data["weather"]

        original_df = prepare_input(data.copy())
        original_probability = model.predict_proba(original_df)[0][1]
        original_risk = get_risk(original_probability)

        simulated_data = data.copy()

        if original_weather == "clear":
            simulated_data["weather"] = "rain"
        elif original_weather == "cloudy":
            simulated_data["weather"] = "storm"

        simulated_df = prepare_input(simulated_data)
        new_probability = model.predict_proba(simulated_df)[0][1]
        new_risk = get_risk(new_probability)

        impact = new_probability - original_probability

        if impact > 0:
            insight = f"Delay risk increased by {round(impact * 100)}% due to worsening weather conditions"
        else:
            insight = "No significant impact detected"

        prompt = f"""
Explain how weather change from {original_weather} to {simulated_data['weather']} affects delays.
"""
        ai_explanation = gemini_explain(prompt)

        return {
            "original_weather": original_weather,
            "simulated_weather": simulated_data["weather"],
            "before": {
                "probability": round(float(original_probability), 2),
                "risk": original_risk
            },
            "after": {
                "probability": round(float(new_probability), 2),
                "risk": new_risk
            },
            "impact_change": round(impact, 2),
            "insight": insight,
            "explanation": explain(simulated_data, new_risk),
            "ai_explanation": ai_explanation
        }

    except Exception:
        return {"error": "Internal server error"}