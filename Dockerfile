# One image: builds web/, then serves it from FastAPI next to the API (decision 8).

# ── 1. Build the web app ──────────────────────────────────────────────
FROM node:22.22.0-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# Optional: prefill the login form for the demo (web/.env.example). Render passes the service's
# environment variables in as build arguments.
ARG VITE_DEMO_LOGIN_EMAIL=""
ARG VITE_DEMO_LOGIN_PASSWORD=""
RUN npm run build

# ── 2. The API, serving the built web app ─────────────────────────────
FROM python:3.13.9-slim
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/api/.venv/bin:$PATH" \
    WEB_DIST_DIR=/app/web/dist

WORKDIR /app/api
# Dependencies first, so a code change doesn't reinstall them.
COPY api/pyproject.toml api/uv.lock ./
RUN uv sync --frozen --no-dev
COPY api/ ./
COPY --from=web /web/dist /app/web/dist

# Not root; it owns /app/api because the SQLite file is created there.
RUN useradd --create-home app && chown -R app /app/api
USER app

EXPOSE 8000
CMD ["sh", "scripts/start.sh"]
