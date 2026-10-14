"""Vercel entrypoint: exposes the FastAPI app as a serverless function."""
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode

# Make the `app` package importable when Vercel runs this file directly.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app as fastapi_app  # noqa: E402

PATH_PARAM = "__path"
FUNCTION_PREFIXES = ("/api/index.py", "/api/index")


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
        else:
            for prefix in FUNCTION_PREFIXES:
                if path == prefix or path.startswith(prefix + "/"):
                    path = path[len(prefix):] or "/"
                    break
        rest = urlencode([(key, value) for key, value in query if key != PATH_PARAM])
        print(
            f"[vercel] incoming path={scope.get('path')!r} root_path={scope.get('root_path')!r} "
            f"query={scope.get('query_string', b'')!r} -> path={path!r}",
            flush=True,
        )
        # The app is served from the domain root; a root_path set by the runtime
        # would make Starlette strip it and match no routes.
        scope = {
            **scope,
            "path": path,
            "raw_path": path.encode(),
            "query_string": rest.encode(),
            "root_path": "",
            "vercel_original": {
                "path": scope.get("path"),
                "root_path": scope.get("root_path"),
                "query": scope.get("query_string", b"").decode(errors="replace"),
            },
        }
    await fastapi_app(scope, receive, send)
