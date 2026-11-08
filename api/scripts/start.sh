#!/bin/sh
# The container's start command (Dockerfile CMD). Render's free tier has no persistent disk, so
# every start begins with an empty database: migrate it, seed it (the seed skips whatever already
# exists), then serve.
set -e

alembic upgrade head
python -m scripts.seed

# No --proxy-headers: with every forwarder trusted, uvicorn would take the client IP from the first
# X-Forwarded-For entry, which the caller writes. app/api/client_ip.py reads the last entry, the one
# Render's proxy adds, for the login rate limit (decision 23).
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
