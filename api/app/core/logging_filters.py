import logging

UVICORN_ACCESS_LOGGER = "uvicorn.access"
QUERY_STRING_SEPARATOR = "?"


class QueryStringFilter(logging.Filter):
    """Removes query strings from access log lines.

    A query string can hold personal data (`?search=asha.rao@acme.com`), and logs may hold
    only routes, ids, status codes and timings. The path is kept; only `?...` is dropped.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(without_query_string(arg) for arg in record.args)
        return True


def without_query_string(value: object) -> object:
    if isinstance(value, str) and value.startswith("/"):
        return value.split(QUERY_STRING_SEPARATOR, 1)[0]
    return value


def install_access_log_filter() -> None:
    access_logger = logging.getLogger(UVICORN_ACCESS_LOGGER)
    if not any(isinstance(existing, QueryStringFilter) for existing in access_logger.filters):
        access_logger.addFilter(QueryStringFilter())
