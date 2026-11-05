from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

INDEX_HTML = "<!doctype html><title>Salary Management</title>"
ASSET_JS = "console.log('app')"
IMMUTABLE_CACHE = "public, max-age=31536000, immutable"
NO_CACHE = "no-cache"


@pytest.fixture
def web_dist_dir(tmp_path: Path) -> Path:
    """A stand-in for web/dist: index.html plus one hashed asset."""
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text(INDEX_HTML, encoding="utf-8")
    (dist / "assets" / "a1b2c3.js").write_text(ASSET_JS, encoding="utf-8")
    return dist


@pytest.fixture
def web_client(settings: Settings, web_dist_dir: Path) -> Iterator[TestClient]:
    web_settings = settings.model_copy(update={"web_dist_dir": web_dist_dir})
    with TestClient(create_app(web_settings)) as test_client:
        yield test_client


def test_an_asset_is_served_with_a_year_long_immutable_cache(web_client: TestClient) -> None:
    response = web_client.get("/assets/a1b2c3.js")

    assert response.status_code == 200
    assert response.text == ASSET_JS
    assert response.headers["cache-control"] == IMMUTABLE_CACHE


def test_a_missing_asset_is_a_plain_404_never_the_web_app(web_client: TestClient) -> None:
    response = web_client.get("/assets/old-deploy.js")

    assert response.status_code == 404
    assert "text/html" not in response.headers["content-type"]
    assert response.json() == {"error": "Not Found"}


@pytest.mark.parametrize(
    "path", ["/", "/employees", "/employees?page=2&country=IN", "/salary-insights"]
)
def test_any_other_path_is_the_web_app_and_never_cached(web_client: TestClient, path: str) -> None:
    response = web_client.get(path)

    assert response.status_code == 200
    assert response.text == INDEX_HTML
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == NO_CACHE


@pytest.mark.parametrize("path", ["/api", "/api/unknown", "/api/v1/unknown"])
def test_an_unknown_api_path_is_a_json_404_never_the_web_app(
    web_client: TestClient, path: str
) -> None:
    response = web_client.get(path)

    assert response.status_code == 404
    assert response.json() == {"error": "Not Found"}


def test_a_write_to_an_unknown_api_path_is_a_json_404(web_client: TestClient) -> None:
    response = web_client.post("/api/v1/unknown", json={})

    assert response.status_code == 404
    assert response.json() == {"error": "Not Found"}


def test_the_web_app_never_shadows_an_api_route(web_client: TestClient) -> None:
    response = web_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"data": {"status": "ok"}}


def test_a_protected_api_route_still_needs_a_session(web_client: TestClient) -> None:
    response = web_client.get("/api/v1/employees")

    assert response.status_code == 401


def test_no_web_app_is_served_when_no_build_is_configured(client: TestClient) -> None:
    response = client.get("/employees")

    assert response.status_code == 404
    assert response.json() == {"error": "Not Found"}
