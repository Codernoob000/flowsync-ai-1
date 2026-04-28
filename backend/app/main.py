from fastapi import FastAPI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from app.routes import routes, weather, shipments
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="FlowSync AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/routes", tags=["Routes"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])


@app.get("/")
def read_root():
    return {"message": "FlowSync AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}