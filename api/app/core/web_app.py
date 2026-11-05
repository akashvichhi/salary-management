from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response
from starlette.types import Scope

from app.constants.route_constants import API_PREFIX

ASSETS_PATH = "/assets"
ASSETS_DIR_NAME = "assets"
INDEX_FILE_NAME = "index.html"
# Asset names are content hashes, so a file never changes: browsers may keep it for a year.
IMMUTABLE_CACHE = "public, max-age=31536000, immutable"
# index.html names the current assets, so every load checks for a newer deploy.
NO_CACHE = "no-cache"
WEB_APP_METHODS = ["GET", "HEAD"]
# The catch-all also takes writes, so a write to an unknown /api path is a 404, not a 405.
ALL_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]
NOT_FOUND = 404


class ImmutableStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = IMMUTABLE_CACHE
        return response


def is_api_path(path: str) -> bool:
    return path == API_PREFIX or path.startswith(f"{API_PREFIX}/")


def mount_web_app(app: FastAPI, dist_dir: Path) -> None:
    """Serves the React build. Registered after every API route, so it can never shadow one.

    A missing asset is a plain 404 (StaticFiles raises it), so a stale tab can tell a missing file
    from a page; every other path that isn't the API gets index.html, for React Router.
    """
    index_file = dist_dir / INDEX_FILE_NAME
    app.mount(
        ASSETS_PATH, ImmutableStaticFiles(directory=dist_dir / ASSETS_DIR_NAME), name="assets"
    )

    @app.api_route("/{path:path}", methods=ALL_METHODS, include_in_schema=False)
    def serve_web_app(request: Request) -> FileResponse:
        if is_api_path(request.url.path) or request.method not in WEB_APP_METHODS:
            raise StarletteHTTPException(status_code=NOT_FOUND)
        return FileResponse(index_file, headers={"Cache-Control": NO_CACHE})
