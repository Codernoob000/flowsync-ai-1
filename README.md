# FlowSync AI

> AI-powered supply chain route optimization system

## Architecture

Frontend → FastAPI Backend → AI Engine → External APIs

## Folder Explanation

- **backend/**: Main FastAPI system containing routes, services, and ML inference.
- **ml/**: Machine learning training code and data generation scripts (only used for training).
- **frontend/**: UI codebase for mapping and visualizing logistics routes.

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

- **`POST /routes/best-route`**: Evaluates routes using the AI engine and real-time weather to select the optimal path.
- **`GET /routes/demo`**: Ready-made demo endpoint.
- **`GET /weather/{city}`**: Fetches real-time weather conditions via OpenWeather.
- **`GET /shipments/`**: Shipment management API.

## Demo Flow

To test route optimization:
1. Ensure the server is running.
2. Send a POST request to `/routes/best-route` with `origin`, `destination`, and coordinates.
3. The system will retrieve possible routes, check live weather, evaluate them using the ML model, and return the safest and fastest option.
