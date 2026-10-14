import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

# AI provider settings — always come from the environment, never hardcoded.
def _clean(value: str | None) -> str | None:
    """Strip whitespace and wrapping quotes often pasted into hosting dashboards."""
    if value is None:
        return None
    return value.strip().strip("'\"").strip() or None


GROQ_API_KEY: str | None = _clean(os.getenv("GROQ_API_KEY"))
GROQ_MODEL: str | None = _clean(os.getenv("GROQ_MODEL"))

MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

# Comma-separated list of allowed frontend origins for CORS.
# Example: "https://my-app.vercel.app,http://localhost:3000"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
