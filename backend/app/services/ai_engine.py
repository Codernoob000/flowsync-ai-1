import os
import pathlib

# -----------------------------
# LAZY IMPORTS — pandas, pickle, sklearn are NOT imported at module level.
# They are loaded on first request to avoid blocking Cloud Run startup.
# -----------------------------
_THIS_DIR = pathlib.Path(__file__).resolve().parent
MODEL_PATH = _THIS_DIR.parent.parent / "model.pkl"

_model = None
_model_loaded = False  # False = not yet attempted; True = attempted (may still be None)


def _ensure_model():
    """Lazy-load the ML model on first call. Never blocks app startup."""
    global _model, _model_loaded
    if _model_loaded:
        return _model
    _model_loaded = True
    try:
        import pickle
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        print("[OK] Model loaded from", MODEL_PATH)
    except Exception as e:
        print("[WARN] Model load failed:", e, "- Using rule-based fallback.")
        _model = None
    return _model


# -----------------------------
# Prepare Input (lazy pandas import)
# -----------------------------
def prepare_input(data):
    model = _ensure_model()
    if model is None:
        return None

    import pandas as pd
    df = pd.DataFrame([data])
    df = pd.get_dummies(df)

    model_columns = model.feature_names_in_

    for col in model_columns:
        if col not in df:
            df[col] = 0

    return df[model_columns]

# -----------------------------
# Risk from ML
# -----------------------------
def get_risk(probability):
    if probability < 0.35:
        return "Low"
    elif probability < 0.75:
        return "Medium"
    else:
        return "High"

# -----------------------------
# Rule-based risk (fallback when model is None)
# -----------------------------
def get_risk_heuristic(route):
    """Determine risk from route data without ML model."""
    traffic = route.get("traffic", "medium")
    weather = route.get("weather", "clear")
    time_of_day = route.get("time_of_day", "morning")

    score = 0.3  # baseline

    if traffic == "high":
        score += 0.3
    elif traffic == "medium":
        score += 0.15

    if weather in ["storm", "thunderstorm"]:
        score += 0.35
    elif weather in ["rain", "fog", "foggy"]:
        score += 0.2
    elif weather in ["drizzle", "mist", "haze"]:
        score += 0.1

    if time_of_day in ["evening", "night"]:
        score += 0.1

    score = min(score, 1.0)
    return score, get_risk(score)

# -----------------------------
# Explanation Generator
# -----------------------------
def explain(data, risk):
    reasons = []

    if data.get("traffic") == "high":
        reasons.append("heavy traffic")
    elif data.get("traffic") == "medium":
        reasons.append("moderate traffic")

    if data.get("weather") in ["rain", "storm", "fog", "foggy"]:
        reasons.append("adverse weather conditions")

    if data.get("time_of_day") in ["evening", "night"]:
        reasons.append("peak hour timing")

    if not reasons:
        return f"{risk} delay risk under normal conditions"

    return f"{risk} risk due to " + ", ".join(reasons)

# -----------------------------
# SMART HYBRID SCORING
# -----------------------------
def route_score(route, risk, probability):
    score = 0

    # Traffic (major factor)
    if route["traffic"] == "low":
        score += 20
    elif route["traffic"] == "medium":
        score += 10
    else:
        score += 0

    # Weather impact
    if route["weather"] in ["clear", "clouds"]:
        score += 15
    else:
        score += 5

    # Distance penalty
    score -= route["distance"] * 0.05

    # ML probability influence
    score -= probability * 20

    # Risk penalty
    risk_penalty = {"Low": 0, "Medium": 15, "High": 40}
    score -= risk_penalty[risk]

    return round(score, 2)

# -----------------------------
# MAIN FUNCTION
# -----------------------------
def evaluate_routes(routes):
    model = _ensure_model()
    results = []

    for route in routes:
        # Use ML model if available, otherwise fall back to heuristics
        if model is not None:
            df = prepare_input(route)
            probability = float(model.predict_proba(df)[0][1])
            risk = get_risk(probability)
        else:
            probability, risk = get_risk_heuristic(route)

        # SAFETY OVERRIDES
        if route["weather"] == "storm":
            risk = "High"
        elif route["traffic"] == "high" and route["weather"] == "rain":
            risk = "High"
        elif route["traffic"] == "low" and route["weather"] == "clear":
            risk = "Low"

        # SMART SCORING
        score = route_score(route, risk, probability)

        # Action
        if risk == "High":
            action = "Avoid route"
        elif risk == "Medium":
            action = "Use with caution"
        else:
            action = "Safe route"

        explanation = explain(route, risk)
        
        results.append({
            "route": route,
            "risk": risk,
            "score": score,
            "probability": round(float(probability), 2),
            "explanation": explanation,
            "action": action
        })

    # PRIORITIZE SAFETY + SCORE
    risk_priority = {"Low": 0, "Medium": 1, "High": 2}
    best = min(results, key=lambda x: (risk_priority[x["risk"]], -x["score"]))

    # Decision reasoning
    if all(r["risk"] == "High" for r in results):
        decision_reason = "All routes are high risk. Selected the least risky option, but delays are expected."
    else:
        decision_reason = "Selected route balances lowest risk, optimal distance, and traffic conditions"

    return {
        "all_routes": results,
        "best_route": best,
        "decision_reason": decision_reason
    }