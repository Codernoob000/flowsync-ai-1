from fastapi import FastAPI
from dotenv import load_dotenv
import pathlib
import os

# Load environment variables — resolve relative to THIS file
# On Cloud Run: env vars are set via console, .env may not exist
_BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
_env_file = _BACKEND_DIR / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

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

# Serve frontend static files (only when running locally)
try:
    from fastapi.staticfiles import StaticFiles
    _FRONTEND_DIR = _BACKEND_DIR.parent / "frontend"
    if _FRONTEND_DIR.is_dir():
        app.mount("/app", StaticFiles(directory=str(_FRONTEND_DIR), html=True), name="frontend")
except Exception:
    pass


@app.get("/")
def read_root():
    return {"message": "FlowSync AI API is running", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health_check():
    return {"status": "ok"}