# 🚀 FlowSync AI

### AI-Powered Route Risk Prediction & Optimization

> **We don't just find routes — we predict the safest one using AI, live traffic, and real-time weather.**

---

## 📌 Overview

FlowSync AI is an intelligent logistics routing system that evaluates multiple routes and selects the safest, most efficient path using AI-driven risk prediction.

Unlike traditional navigation that optimizes only for distance or time, FlowSync AI analyzes:

- 🚗 **Live Traffic** — Real-time congestion data via Google Maps Directions API
- 🌦️ **Weather Impact** — Conditions from OpenWeather API with severity scoring
- 🧠 **AI Risk Prediction** — ML model + heuristic scoring engine
- 📊 **Smart Scoring** — Hybrid algorithm combining traffic, weather, distance, and time-of-day

---

## 🎯 Problem Statement

Modern logistics systems face unpredictable delays due to:

- Traffic congestion with no advance warning
- Weather disruptions affecting road safety
- Suboptimal route decisions based on distance alone

These inefficiencies result in delayed deliveries, increased fuel costs, and reduced reliability.

---

## 💡 Solution

FlowSync AI provides a full-stack intelligent routing engine that:

| Capability | Description |
|-----------|-------------|
| 🛣️ Multi-Route Analysis | Fetches and evaluates up to 3 alternative routes |
| ⚠️ Risk Classification | Assigns Low / Medium / High risk with probability scores |
| 🤖 AI Best Route Selection | Selects optimal route balancing safety + distance + traffic |
| 🗺️ Interactive Map | Visualizes routes with color-coded risk on dark-themed Leaflet map |
| 🔮 24h Risk Simulation | Forecasts how route risks change over the next 24 hours |
| 💡 AI Explanations | Human-readable reasoning for each route's risk level |

---

## ⚙️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│   HTML/CSS/JS · Leaflet.js Map · Dynamic UI          │
│   Origin/Destination Input → API Call → Results      │
└──────────────┬───────────────────────────────────────┘
               │  POST /routes/best-route
               ▼
┌──────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                     │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Route Service│  │Weather Service│  │ AI Engine  │  │
│  │ Google Maps  │  │ OpenWeather  │  │ ML + Rules │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                      │
│  Routes → Weather → Risk Scoring → Best Route        │
└──────────────────────────────────────────────────────┘
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Leaflet.js |
| **Backend** | FastAPI (Python), Uvicorn |
| **AI/ML** | Scikit-learn (RandomForest), Pandas, Rule-based fallback |
| **APIs** | Google Maps Directions, OpenWeather, Gemini AI (optional) |
| **Deployment** | Google Cloud Run (Buildpacks) |
| **Map Tiles** | CartoDB Dark Matter (free, no API key) |

---

## 📂 Project Structure

```
flowsync_AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── routes.py        # /routes/best-route, /routes/predict, /routes/demo
│   │   │   ├── weather.py       # /weather/{city}
│   │   │   └── shipments.py     # /shipments
│   │   ├── services/
│   │   │   ├── ai_engine.py     # ML model + risk scoring (lazy-loaded)
│   │   │   ├── route_svc.py     # Google Maps API integration
│   │   │   ├── weather_svc.py   # OpenWeather API integration
│   │   │   └── gemini_svc.py    # Gemini AI explanations (optional)
│   │   └── models/
│   │       └── schemas.py       # Pydantic request schemas
│   ├── model.pkl                # Trained ML model
│   ├── requirements.txt
│   ├── Procfile                 # Cloud Run entrypoint
│   └── runtime.txt              # Python version for buildpack
│
├── frontend/
│   ├── index.html               # Main UI
│   ├── css/
│   │   ├── style.css            # Core design system
│   │   ├── components.css       # Route cards, insights, controls
│   │   ├── animations.css       # Particle canvas, transitions
│   │   └── map.css              # Map container & overlays
│   └── js/
│       ├── app.js               # Main app logic & event handling
│       ├── api.js               # Backend API client + auto-detection
│       ├── map.js               # Leaflet map rendering
│       └── demo.js              # Demo mode data & fallback
│
├── ml/
│   ├── model.py                 # Model training script
│   ├── predict.py               # Standalone prediction script
│   └── data.csv                 # Training dataset
│
├── START_FLOWSYNC.bat           # Windows one-click launcher
├── STOP_FLOWSYNC.bat            # Windows stop script
└── README.md
```

---

## 🚀 Quick Start

### Option 1: One-Click (Windows)

```
Double-click START_FLOWSYNC.bat
```

This starts both backend (port 8000) and frontend (port 3000), then opens Chrome.

### Option 2: Manual Setup

**1. Start Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**2. Start Frontend:**
```bash
cd frontend
npx http-server -p 3000 -c-1
```

**3. Open:** [http://localhost:3000](http://localhost:3000)

### Option 3: Demo Mode (No Backend Needed)

Simply open `frontend/index.html` in any browser. The app auto-detects that the backend is offline and falls back to demo mode with realistic Hyderabad route data.

---

## 🧪 API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/health` | GET | Health check | None |
| `/routes/best-route` | POST | AI-optimized route analysis | None |
| `/routes/predict` | POST | Single route risk prediction | None |
| `/routes/demo` | GET | Demo route (Mumbai → Hyderabad) | None |
| `/weather/{city}` | GET | Live weather for a city | None |
| `/weather/both/{origin}/{dest}` | GET | Weather for both endpoints | None |
| `/docs` | GET | Interactive Swagger docs | None |

### Example Request

```bash
curl -X POST http://localhost:8000/routes/best-route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Mumbai",
    "destination": "Hyderabad",
    "origin_lat": 19.076,
    "origin_lng": 72.877,
    "dest_lat": 17.385,
    "dest_lng": 78.486
  }'
```

### Example Response

```json
{
  "all_routes": [
    {
      "risk": "Low",
      "score": 15.2,
      "probability": 0.18,
      "explanation": "Low delay risk under normal conditions",
      "action": "Safe route"
    }
  ],
  "best_route": { ... },
  "decision_reason": "Selected route balances lowest risk, optimal distance, and traffic conditions"
}
```

---

## ☁️ Cloud Run Deployment

```bash
cd backend

gcloud run deploy flowsync-ai \
  --source=. \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars="GEMINI_API_KEY=xxx,OPENWEATHER_API_KEY=xxx,GOOGLE_MAPS_API_KEY=xxx"
```

> **Note:** Heavy dependencies (pandas, scikit-learn, model.pkl) are lazy-loaded on first request, not at startup, ensuring fast Cloud Run cold starts.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Optional | Real route data (falls back to mock routes) |
| `OPENWEATHER_API_KEY` | Optional | Live weather (falls back to mock weather) |
| `GEMINI_API_KEY` | Optional | AI-generated explanations (falls back to rule-based) |

All APIs are **optional** — the app works fully without any keys using intelligent fallbacks.

---

## 🎥 How It Works

1. **User enters** origin and destination
2. **Frontend** sends POST to `/routes/best-route`
3. **Backend** fetches routes from Google Maps + weather from OpenWeather
4. **AI Engine** scores each route using ML model + heuristics
5. **Response** returns ranked routes with risk levels and explanations
6. **Frontend** renders route cards, draws polylines on map, shows AI insights

---

## 🧠 AI Scoring System

The risk scoring engine uses a hybrid approach:

- **ML Model** (when available): RandomForest classifier trained on traffic/weather/distance features
- **Rule-based Fallback**: Heuristic scoring based on traffic level, weather severity, and time of day
- **Safety Overrides**: Storm conditions or heavy traffic + rain automatically force High risk
- **Smart Scoring**: Composite score combining traffic weight, weather impact, distance penalty, and ML probability

---

## 🚀 Future Scope

- Real-time traffic streaming with WebSockets
- Predictive delay modeling using historical patterns
- Multi-vehicle fleet optimization
- IoT sensor integration for live road conditions
- Mobile app (React Native / Flutter)

---

## 👥 Team

Built for **Google Solution Challenge**

---

⭐ **FlowSync AI** — Predict. Optimize. Deliver.
