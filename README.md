# FlowSync AI – Intelligent Route Optimization System

## Overview
FlowSync AI is an AI-powered route optimization platform that integrates real-time data to suggest the most efficient and safest paths. It uses Google Maps for multi-route generation, OpenWeather for dynamic weather condition integration, and a Scikit-learn machine learning model for risk prediction, all explained clearly via Gemini AI.

## Features
* Multi-route generation (Google Maps)
* Traffic-aware routing
* Weather integration
* ML-based risk prediction
* Gemini-powered explanations
* Best route selection

## Tech Stack
* FastAPI
* Python
* Google Maps API
* OpenWeather API
* Gemini API
* Scikit-learn

## Project Structure
* `backend/` - The main backend directory.
* `app/` - The core application codebase.
* `routes/` - FastAPI router definitions and endpoint handlers.
* `services/` - Business logic, AI integration, and external API calls.
* `models/` - Machine learning models and data schemas.

## Setup Instructions
1. Clone repo
2. Go to `backend/` directory
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file with your API keys:
   ```env
   GEMINI_API_KEY=your_key_here
   OPENWEATHER_API_KEY=your_key_here
   GOOGLE_MAPS_API_KEY=your_key_here
   ```
5. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints
* `POST /routes/best-route` - Calculates and returns the optimal route along with alternative paths.
* `GET /weather/{city}` - Fetches real-time weather information for the specified city.
* `GET /routes/demo` - Returns a set of demo routes for quick testing and visualization.

## Example Usage
**Mumbai → Hyderabad**
The system evaluates multiple paths between Mumbai and Hyderabad, accounting for traffic and weather anomalies.

## Output Includes
* routes
* risk levels
* AI explanation
* best route

## Future Improvements
* frontend map visualization
* real-time alerts
* dashboard UI
