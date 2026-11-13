# The web app, built and served by nginx, which forwards /api to the API container
# (docker-compose.yml). Render uses the root Dockerfile instead (decision 8).
# Build context: the repository root, so the root .dockerignore applies.

# ── 1. Build ──────────────────────────────────────────────────────────
FROM node:22.22.0-alpine AS build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# The login prefill from web/.env (decision 24). The root .dockerignore keeps every .env out of
# the main context, so docker-compose.yml passes web/ in again as `web_env`. Only the
# VITE_DEMO_LOGIN_* lines are kept: VITE_API_URL there points at the dev server, and the image must
# call its own origin. The wildcard also matches .env.example, so the COPY works without a .env.
COPY --from=web_env .env* /tmp/web_env/
RUN if [ -f /tmp/web_env/.env ]; then grep '^VITE_DEMO_LOGIN_' /tmp/web_env/.env > .env.production.local || true; fi \
    && rm -rf /tmp/web_env \
    && npm run build

# ── 2. Serve ──────────────────────────────────────────────────────────
FROM nginx:1.28.0-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 80
