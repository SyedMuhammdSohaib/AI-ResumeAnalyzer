"""Vercel entrypoint: exposes the FastAPI app as a serverless function."""
import sys
from pathlib import Path

# Make the `app` package importable when Vercel runs this file directly.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402,F401
