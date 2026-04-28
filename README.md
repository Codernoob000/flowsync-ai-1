# 🚀 FlowSync AI

### Intelligent Route Optimization with AI, Weather & Traffic Awareness

---

## 📌 Overview

FlowSync AI is an intelligent logistics routing system that analyzes multiple routes and selects the safest and most efficient option using AI-driven decision making.

Unlike traditional navigation systems that focus only on shortest distance, FlowSync AI considers:

* 🚗 Traffic conditions
* 🌦️ Weather impact
* 📏 Distance
* 🧠 AI risk prediction

---

## 🎯 Problem Statement

Modern logistics systems face unpredictable delays due to:

* Traffic congestion
* Weather disruptions
* Poor route decision-making

These inefficiencies lead to:

* Delayed deliveries
* Increased costs
* Poor reliability

---

## 💡 Solution

FlowSync AI provides a smart routing engine that:

* Evaluates multiple routes
* Assigns risk levels (Low / Medium / High)
* Uses AI to select the optimal route
* Visualizes routes on an interactive map

---

## ⚙️ Features

### 🧠 AI Route Evaluation

* Predicts risk using ML model
* Generates explanations for route selection

### 🌦️ Weather Integration

* Uses real-time weather data (OpenWeather API)
* Adjusts route risk dynamically

### 🗺️ Map Visualization

* Displays multiple routes
* Highlights best route
* Color-coded risk levels

### ⚡ Demo Mode (Stable)

* Fully functional without backend
* Simulates real-world traffic & conditions
* Ensures smooth hackathon demo

---

## 🧱 Tech Stack

### Frontend

* HTML, CSS, JavaScript
* Leaflet.js (map rendering)

### Backend

* FastAPI (Python)
* REST APIs

### AI / ML

* Scikit-learn model
* Risk prediction system

### APIs

* OpenWeather API
* (Optional) Google Maps Directions API
* (Optional) Gemini AI for explanations

---

## 📂 Project Structure

```
flowsync_AI/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── main.py
│   ├── model.pkl
│   ├── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   ├── map.js
│   │   └── demo.js
│
├── ml/
│   ├── model.py
│   ├── predict.py
│   └── data.csv
│
├── README.md
└── .gitignore
```

---

## 🚀 How to Run

### 🟢 Demo Mode (Recommended for Judges)

No backend required.

1. Open frontend:

```
cd frontend
```

2. Run:

```
python -m http.server 5500
```

3. Open:

```
http://127.0.0.1:5500
```

✔ Demo loads automatically
✔ Routes and map will display

---

### 🔵 Full Backend Mode (Optional)

1. Start backend:

```
cd backend
uvicorn app.main:app --reload
```

2. Open frontend:

```
cd frontend
python -m http.server 5500
```

---

## 🧪 API Endpoints (Backend Mode)

| Endpoint             | Method | Description            |
| -------------------- | ------ | ---------------------- |
| `/routes/best-route` | POST   | Get AI-optimized route |
| `/weather/{city}`    | GET    | Get weather data       |
| `/routes/demo`       | GET    | Demo route             |

---

## 🎥 Demo Highlights

* Enter origin & destination
* Analyze routes
* View multiple paths
* AI selects best route
* Map visualizes results

---

## 🧠 Key Innovation

FlowSync AI goes beyond navigation:

> “We don’t just find routes — we predict the best one using AI.”

---

## ⚠️ Notes

* Demo mode is enabled for stability
* Backend + APIs can be used for real-time data
* Gemini integration is optional (disabled for demo reliability)

---

## 🚀 Future Scope

* Real-time traffic APIs
* Predictive delay modeling
* IoT integration for logistics
* Fleet-level optimization
* Mobile app deployment

---

## 👥 Team

* Backend & AI Development
* Frontend & UI Design
* Integration & Testing

---

## 🏁 Conclusion

FlowSync AI provides a scalable and intelligent solution for modern logistics challenges by combining AI, real-time data, and intuitive visualization.

---

⭐ Built for Hackathon Excellence
