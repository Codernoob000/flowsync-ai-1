# 🚀 FlowSync AI
**AI-Powered Smart Supply Chain Optimization System**

[![Built with FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com/)
[![Powered by Machine Learning](https://img.shields.io/badge/Machine_Learning-FF9900?style=for-the-badge&logo=scikit-learn&logoColor=white)]()
[![Gemini API](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)]()

## 📌 Problem Statement
Global supply chains are incredibly vulnerable to unexpected disruptions such as adverse weather, traffic congestions, and unforeseen delays. Traditional routing methods rely on static data and fail to dynamically adapt to real-time risks, leading to massive financial losses, delayed deliveries, and increased carbon footprints.

## 💡 Solution Overview
**FlowSync AI** is an intelligent supply chain optimization engine designed to proactively mitigate delivery risks. By leveraging Machine Learning and the Google Gemini API, it predicts potential delays, assesses risk levels, and dynamically calculates the most optimized delivery routes. Furthermore, it incorporates a simulation engine to forecast future disruptions, providing actionable, human-readable AI insights for supply chain managers.

## ✨ Key Features
- **🔮 Predictive Delay Analysis**: Uses a trained Random Forest model to calculate delay probabilities.
- **🚦 Dynamic Risk Assessment**: Automatically categorizes delivery risks into Low, Medium, or High.
- **🗺️ Intelligent Route Optimization**: Compares multiple paths and selects the best route balancing both distance and real-time risk.
- **🌪️ Disruption Simulation Engine**: Simulates future risk changes (e.g., sudden weather events) to test supply chain resilience.
- **🧠 Human-like AI Explanations**: Integrates Google Gemini API to translate complex data into clear, actionable insights for decision-makers.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python)
- **Machine Learning**: Scikit-Learn (Random Forest Classifier), Pandas, NumPy
- **AI Integration**: Google GenAI SDK (with timeout & fallback safety)
- **Deployment**: Uvicorn

## 📂 Project Structure
```text
flowsync_AI/
├── backend/
│   └── app.py              # Main FastAPI application and API routes
├── ai_model/
│   ├── model.py            # Machine Learning model training logic
│   ├── predict.py          # Inference script for delay predictions
│   └── data.csv            # Dataset used for training the RF model
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables (Gemini API keys)
```

## 🚀 How to Run

### 1. Clone the Repository
```bash
git clone https://github.com/Codernoob000/flowsync-ai-1.git
cd flowsync-ai-1
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 5. Start the Application
```bash
uvicorn backend.app:app --reload
```
*The API will be available at `http://127.0.0.1:8000`. You can view the interactive documentation at `http://127.0.0.1:8000/docs`.*

## 🔌 API Endpoints

### 1. Predict Delay Risk
- **Endpoint**: `POST /predict`
- **Description**: Accepts delivery parameters and returns the predicted delay probability and corresponding risk level (Low, Medium, High).

### 2. Get Best Route
- **Endpoint**: `POST /best-route`
- **Description**: Evaluates multiple potential delivery routes and returns the most optimal path based on calculated risk scores and distance.

### 3. Simulate Future Disruptions
- **Endpoint**: `POST /simulate`
- **Description**: Runs a simulation adjusting variables like weather or traffic to forecast how future risk changes will impact the supply chain, supplemented with Gemini AI explanations.

## 🔭 Future Scope
- **Real-Time GPS Integration**: Connect with live tracking APIs (e.g., Google Maps API) for live vehicle routing.
- **Multi-Agent Reinforcement Learning**: Upgrade the route optimization engine for massive-scale fleet management.
- **Interactive Dashboard**: Build a React/Next.js frontend for real-time visualization of fleet health and disruption simulations.
- **Blockchain Verification**: Secure logistics and handover data immutably across the supply chain.

## 👥 Team
- **[Your Name/Teammate 1]** - Role (e.g., ML Engineer / Backend Developer)
- **[Teammate 2]** - Role
- **[Teammate 3]** - Role
- **[Teammate 4]** - Role

---
*Built with ❤️ for the Google Solution Challenge.*
