import logging

import pytest

from app.core.config import Settings
from app.main import create_app

ACCESS_LOG_FORMAT = '%s - "%s %s HTTP/%s" %d'


def log_access(path: str) -> None:
    """Logs a line exactly as uvicorn's access logger does."""
    logging.getLogger("uvicorn.access").info(
        ACCESS_LOG_FORMAT, "127.0.0.1:50000", "GET", path, "1.1", 200
    )


def test_access_log_leaves_out_the_query_string(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    create_app(settings)
    caplog.set_level(logging.INFO, logger="uvicorn.access")

    log_access("/api/v1/employees?search=asha.rao%40acme.com&page=2")

    # Search text can be a name or an email, so only the path is logged.
    assert caplog.messages == ['127.0.0.1:50000 - "GET /api/v1/employees HTTP/1.1" 200']


def test_access_log_keeps_a_path_without_a_query_string(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    create_app(settings)
    caplog.set_level(logging.INFO, logger="uvicorn.access")

    log_access("/api/v1/employees/7")

    assert caplog.messages == ['127.0.0.1:50000 - "GET /api/v1/employees/7 HTTP/1.1" 200']


def test_creating_the_app_twice_installs_the_filter_once(settings: Settings) -> None:
    create_app(settings)
    create_app(settings)

    assert len(logging.getLogger("uvicorn.access").filters) == 1


def test_access_log_passes_named_arguments_unchanged(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    create_app(settings)
    caplog.set_level(logging.INFO, logger="uvicorn.access")

    logging.getLogger("uvicorn.access").info("%(event)s", {"event": "Access log started"})

    assert caplog.messages == ["Access log started"]
