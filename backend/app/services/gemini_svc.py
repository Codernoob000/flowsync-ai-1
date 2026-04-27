import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def generate_explanation(route, risk):
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