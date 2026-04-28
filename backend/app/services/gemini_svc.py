import os

try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    genai = None
    _GENAI_AVAILABLE = False


def generate_explanation(route, risk):
    """Generate AI explanation using Gemini. Raises on failure so caller can fallback."""
    if not _GENAI_AVAILABLE:
        raise RuntimeError("google-generativeai package not installed")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are an AI logistics expert.

Explain in ONE short sentence why this route has {risk} risk.

Focus on:
- traffic conditions
- weather impact
- time of day

Avoid generic reasons like "long distance".

Data:
Traffic: {route['traffic']}
Weather: {route['weather']}
Time: {route['time_of_day']}
Distance: {route['distance']} km
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print("GEMINI SERVICE ERROR:", e)
        raise e