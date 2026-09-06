"""
UI Layer entry point (the REST API surface the React app talks to).

Per layered_architecture.md: the React app never calls the Domain layer
directly -- everything crosses this HTTP/REST boundary, implemented with
FastAPI. This module just wires up middleware + routers; all business logic
lives in app.domain.controllers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_auth, routes_products, routes_reports, routes_sales, routes_users
from app.technical_services.logging.logger import log_action
from app.technical_services.persistence.database import init_db

app = FastAPI(
    title="GadgetPOS API",
    description="Electronics/Gadgets Store Point of Sale system -- REST API (FastAPI + SQLModel).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # coursework/demo scope; tighten for a real deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_products.router)
app.include_router(routes_sales.router)
app.include_router(routes_reports.router)
app.include_router(routes_users.router)


@app.on_event("startup")
def on_startup():
    init_db()
    log_action("server_startup")


@app.get("/")
def root():
    return {"service": "GadgetPOS API", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
