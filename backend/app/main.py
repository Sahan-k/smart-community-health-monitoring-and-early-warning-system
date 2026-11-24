from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.app.database.init_admin import init_predefined_accounts
from backend.app.routes import (
    auth_routes,
    reports_routes,
    alerts_routes,
    notifications_routes,
    dashboard_routes,
    chat_routes,
    users_routes,
    locations_routes,
    fcm_routes,
)

app = FastAPI(
    title="Smart Community Health Monitoring and Early Warning System",
    description="MCA Major Project Backend API integrating PostgreSQL, ML Risk Inference, Alert Verification, and AI Assistant.",
    version="1.0.0"
)

# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_routes.router)
app.include_router(reports_routes.router)
app.include_router(alerts_routes.router)
app.include_router(notifications_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(chat_routes.router)
app.include_router(users_routes.router)
app.include_router(locations_routes.router)
app.include_router(fcm_routes.router)


@app.on_event("startup")
def on_startup():
    try:
        init_predefined_accounts()
    except Exception as e:
        logging.getLogger(__name__).warning("Startup accounts initialization deferred: %s", e)


@app.get("/")
def root():
    return {
        "message": "Smart Community Health Monitoring API is running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }