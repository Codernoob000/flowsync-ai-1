from fastapi import FastAPI
from dotenv import load_dotenv
import os

# ✅ FORCE correct .env path
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH)

from app.routes import routes, weather, shipments

app = FastAPI(title="FlowSync AI API")

app.include_router(routes.router, prefix="/routes", tags=["Routes"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])


@app.get("/")
def read_root():
    return {"message": "FlowSync AI API is running"}