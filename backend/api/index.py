"""Vercel entrypoint: exposes the FastAPI app as a serverless function."""
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode

# Make the `app` package importable when Vercel runs this file directly.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app as fastapi_app  # noqa: E402

PATH_PARAM = "__path"
FUNCTION_PREFIX = "/api/index"


async def app(scope, receive, send):
    """Restore the original request path before handing the request to FastAPI.

    vercel.json rewrites every request to /api/index?__path=/<original path>, and
    depending on the runtime the function may see either path, so handle both.
    """
    if scope["type"] in ("http", "websocket"):
        query = parse_qsl(scope.get("query_string", b"").decode(), keep_blank_values=True)
        original = next((value for key, value in query if key == PATH_PARAM), None)
        path = scope.get("path", "/")
        if original is not None:
            path = "/" + original.lstrip("/")
        elif path == FUNCTION_PREFIX or path.startswith(FUNCTION_PREFIX + "/"):
            path = path[len(FUNCTION_PREFIX):] or "/"
        rest = urlencode([(key, value) for key, value in query if key != PATH_PARAM])
        scope = {**scope, "path": path, "raw_path": path.encode(), "query_string": rest.encode()}
    await fastapi_app(scope, receive, send)
