from fastapi import FastAPI
import pickle
import pandas as pd
from typing import List, Dict
import os
from dotenv import load_dotenv
import google.generativeai as genai

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# -----------------------------
# Configure Gemini
# -----------------------------
genai.configure(api_key=API_KEY)
model_gemini = genai.GenerativeModel("gemini-2.5-flash")

# -----------------------------
# Load ML Model
# -----------------------------
model = pickle.load(open("model.pkl", "rb"))

app = FastAPI()

# -----------------------------
# Gemini Helper
# -----------------------------
def gemini_explain(prompt):
    try:
        response = model_gemini.generate_content(prompt)
        text = response.text.strip()
        return text[:250] + "..." if len(text) > 250 else text
    except Exception as e:
        print("Gemini Error:", e)
        return "AI explanation unavailable"

# -----------------------------
# Risk Calculation
# -----------------------------
def get_risk(probability):
    if probability < 0.4:
        return "Low"
    elif probability < 0.7:
        return "Medium"
    else:
        return "High"

# -----------------------------
# Rule-based Explanation
# -----------------------------
def explain(data, risk):
    reasons = []

    # Traffic (only meaningful ones)
    if data.get("traffic") == "high":
        reasons.append("heavy traffic")
    elif data.get("traffic") == "medium":
        reasons.append("moderate traffic")

    # Weather (only adverse)
    if data.get("weather") in ["rain", "storm", "foggy"]:
        reasons.append("adverse weather conditions")

    # Time
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
# Route Scoring
# -----------------------------
def route_score(distance, risk, probability):
    weight = {"Low": 1, "Medium": 5, "High": 10}
    return distance + weight[risk] + (probability * 10)

# -----------------------------
# Data Preparation
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
    df = prepare_input(data)

    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]

    risk = get_risk(probability)
    explanation = explain(data, risk)

    # Gemini Prompt
    prompt = f"""
In 2-3 lines, explain why delay risk is {risk}.

Traffic: {data['traffic']}
Weather: {data['weather']}
Time: {data['time_of_day']}
Distance: {data['distance']}
"""

    ai_explanation = gemini_explain(prompt)

    # Action
    if risk == "High":
        action = "Reroute immediately"
    elif risk == "Medium":
        action = "Monitor route"
    else:
        action = "Proceed normally"

    # Optional confidence
    confidence = "High" if probability > 0.8 else "Moderate" if probability > 0.5 else "Low"

    return {
        "prediction": int(prediction),
        "probability": round(float(probability), 2),
        "risk": risk,
        "confidence": confidence,
        "explanation": explanation,
        "ai_explanation": ai_explanation,
        "action": action
    }

# -----------------------------
# Best Route Endpoint
# -----------------------------
@app.post("/best-route")
def best_route(routes: List[Dict]):
    results = []

    for route in routes:
        df = prepare_input(route)

        probability = model.predict_proba(df)[0][1]
        risk = get_risk(probability)
        score = route_score(route["distance"], risk, probability)

        # Gemini Prompt
        prompt = f"""
In 2-3 lines, explain if this route is good or bad.

Traffic: {route['traffic']}
Weather: {route['weather']}
Distance: {route['distance']}
Time: {route['time_of_day']}
"""

        ai_explanation = gemini_explain(prompt)

        action = "Avoid route" if risk == "High" else "Safe route"

        results.append({
            "route": route,
            "risk": risk,
            "score": round(score, 2),
            "probability": round(float(probability), 2),
            "explanation": explain(route, risk),
            "ai_explanation": ai_explanation,
            "action": action
        })

    best = min(results, key=lambda x: x["score"])

    return {
        "all_routes": results,
        "best_route": best,
        "decision_reason": "Selected route has lowest combined risk and distance score"
    }

# -----------------------------
# Simulation Endpoint
# -----------------------------
@app.post("/simulate")
def simulate(data: dict):
    original_weather = data["weather"]

    # BEFORE
    original_df = prepare_input(data.copy())
    original_probability = model.predict_proba(original_df)[0][1]
    original_risk = get_risk(original_probability)

    # SIMULATION (safe copy)
    simulated_data = data.copy()

    if original_weather == "clear":
        simulated_data["weather"] = "rain"
    elif original_weather == "cloudy":
        simulated_data["weather"] = "storm"

    simulated_df = prepare_input(simulated_data)
    new_probability = model.predict_proba(simulated_df)[0][1]
    new_risk = get_risk(new_probability)

    # IMPACT
    impact = new_probability - original_probability

    if impact > 0:
        insight = f"Delay risk increased by {round(impact * 100)}% due to worsening weather conditions"
    else:
        insight = "No significant impact detected"

    # Gemini Prompt
    prompt = f"""
In 2-3 lines, explain how changing weather from {original_weather} to {simulated_data['weather']} affects delivery delays.
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