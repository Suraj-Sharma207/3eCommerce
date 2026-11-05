"""
FastAPI entry point shim for deployment environments (Render, Railway, etc.).
Exports the `app` instance from `app.main`.
"""
from app.main import app

__all__ = ["app"]

