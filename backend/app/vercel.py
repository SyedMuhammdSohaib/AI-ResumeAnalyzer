"""Fixes request paths when the app runs as a Vercel serverless function."""
from urllib.parse import parse_qsl, urlencode

PATH_PARAM = "__path"
FUNCTION_PREFIXES = ("/api/index.py", "/api/index")


class VercelPathMiddleware:
    """Restore the original path if Vercel rewrote the request to the function path.

    Requests may arrive as /api/index?__path=/health or /api/index/health instead of
    /health; both are mapped back so FastAPI's routes match.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
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
            scope = {
                **scope,
                "path": path,
                "raw_path": path.encode(),
                "query_string": rest.encode(),
                "root_path": "",
            }
        await self.app(scope, receive, send)
