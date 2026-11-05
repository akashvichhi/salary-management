#!/bin/sh
# The container's start command (Dockerfile CMD). Render's free tier has no persistent disk, so
# every start begins with an empty database: migrate it, seed it (the seed skips whatever already
# exists), then serve.
set -e

alembic upgrade head
python -m scripts.seed

# --proxy-headers: behind Render's proxy, the client IP comes from X-Forwarded-For, which the login
# rate limit needs (decision 23). Only Render's proxy can reach the container, so any forwarder is
# trusted.
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips '*'
