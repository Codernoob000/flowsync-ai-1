import pickle
import pandas as pd
import os

# -----------------------------
# Load Model (SAFE PATH)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "model.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

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
# Explanation
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
# Route Score (FINAL LOGIC)
# -----------------------------
def route_score(distance, risk, probability):
    weight = {"Low": 1, "Medium": 15, "High": 50}
    return distance + weight[risk] + (probability * 10)

# -----------------------------
# MAIN FUNCTION (IMPORTANT)
# -----------------------------
def evaluate_routes(routes):
    results = []

    for route in routes:
        df = prepare_input(route)

        probability = model.predict_proba(df)[0][1]
        risk = get_risk(probability)

        # 🔥 SAFETY OVERRIDES
        if route["weather"] == "storm":
            risk = "High"
        elif route["traffic"] == "high" and route["weather"] == "rain":
            risk = "High"
        elif route["traffic"] == "low" and route["weather"] == "clear":
            risk = "Low"

        score = route_score(route["distance"], risk, probability)

        # Action logic
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
            "action": action
        })

    # 🔥 PRIORITIZE SAFETY FIRST
    risk_priority = {"Low": 0, "Medium": 1, "High": 2}
    best = min(results, key=lambda x: (risk_priority[x["risk"]], x["score"]))

    # Edge case: all high risk
    if all(r["risk"] == "High" for r in results):
        decision_reason = "All routes are high risk. Selected the least risky option, but delay is unavoidable."
    else:
        decision_reason = "Selected route balances lowest risk and optimal distance for safe delivery"

    return {
        "all_routes": results,
        "best_route": best,
        "decision_reason": decision_reason
    }
