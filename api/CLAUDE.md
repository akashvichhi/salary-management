# Backend rules: Salary Management

@../docs/standards/fastapi.md

## Project-specific backend rules

- **Database:** SQLite (decision 2) via SQLAlchemy 2.x, with `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL`. Python 3.13.
- **Entities and their layer files:** `employee`, `salary_insight`, `user`, `session`; plus `auth_service` / `auth_router`, `login_request`, `employee_option_router`, and `health_router`.
- **Files beyond the shared folder tree:**
  - `core/logging_filters.py`: drops query strings (search text) from access logs
  - `core/money.py`: money rounding, half-up to the cent
  - `core/login_rate_limiter.py`: failed logins per email and IP, in memory (decision 23)
  - `core/origin_check_middleware.py`: the CSRF origin check
  - `core/web_app.py`: serves the web build from `WEB_DIST_DIR`
  - `api/session_cookie.py`: sets and clears the session cookie; `api/client_ip.py`: the caller's IP for the rate limit
  - `scripts/seed.py`, `scripts/start.sh` (the container's start command: migrate, seed, then uvicorn), `scripts/data/` (name lists)
- **Aggregates computed in Python, not SQL:** the median, because SQLite has none (decision 5). One endpoint per insight (decision 19).
- **Fixed lists:** country, department, and job title are `StrEnum`s in `constants/employee_constants.py`, matched ignoring case and spaces and stored in the list's spelling (decision 17). The frontend gets them from `GET /api/v1/employee-options` (decision 21).
- **Indexes:** `country`, `job_title`, `department`, `salary`, `full_name`, `hire_date`, `email` (unique among active employees), and a composite `(country, job_title)` for "average salary per job title within a country". Reasons in `docs/architecture.md`.
- **Timestamps** are stored in IST (`APP_TIMEZONE` in `constants/time_constants.py`).
- **Public endpoints (no auth):** `POST /api/v1/auth/login`, `GET /api/health` (Render's health check path).
- **Session settings** (`core/config.py`): `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS` (default 8), `COOKIE_SECURE`, `ALLOWED_ORIGINS`.
- **Login rate limit:** 5 failures per email and IP within 15 minutes; the sixth gets a 429 (`constants/auth_constants.py`).
- **Seed:** `make seed` (after `uv run alembic upgrade head`) creates 10,000 employees, with title ranges scaled by country (decision 18), and the HR manager user from `HR_MANAGER_EMAIL` / `HR_MANAGER_PASSWORD`.
