from fastapi import FastAPI
from dotenv import load_dotenv
import pathlib
import os
import sys

# ── Startup: log immediately so Cloud Run sees activity ──
print(f"[FlowSync] Starting... PORT={os.environ.get('PORT', 'not set')}, Python={sys.version}")

# Load environment variables — resolve relative to THIS file
# On Cloud Run: env vars are set via console, .env may not exist
_BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
_env_file = _BACKEND_DIR / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FlowSync AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Import routes safely — if any route module fails, app still starts ──
try:
    from app.routes import routes
    app.include_router(routes.router, prefix="/routes", tags=["Routes"])
except Exception as e:
    print(f"[WARN] Failed to load routes module: {e}")

try:
    from app.routes import weather
    app.include_router(weather.router, prefix="/weather", tags=["Weather"])
except Exception as e:
    print(f"[WARN] Failed to load weather module: {e}")

try:
    from app.routes import shipments
    app.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])
except Exception as e:
    print(f"[WARN] Failed to load shipments module: {e}")

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


print("[FlowSync] App object created — ready for server binding.")