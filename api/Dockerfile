# The API on its own, for docker-compose.yml (the web app runs in its own container there).
# Render uses the root Dockerfile instead, which also builds and serves the web app (decision 8).
# Build context: the repository root, so the root .dockerignore applies.

FROM python:3.13.9-slim
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/api/.venv/bin:$PATH"

WORKDIR /app/api
# Dependencies first, so a code change doesn't reinstall them.
COPY api/pyproject.toml api/uv.lock ./
RUN uv sync --frozen --no-dev
COPY api/ ./

# Not root. /app/data holds the SQLite file: a volume mounted there starts with this ownership,
# so the app can write to it.
RUN useradd --create-home app && mkdir /app/data && chown -R app /app/api /app/data
USER app

EXPOSE 8000
CMD ["sh", "scripts/start.sh"]
