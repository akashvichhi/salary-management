# Salary Management

A web app where an HR manager manages salary data for 10,000 employees across countries, and answers questions about how the organisation pays people. Built for the Incubyte engineering assessment.

**Live demo:** https://salary-management-k859.onrender.com. The login form comes filled in with the demo account (`hr@example.com` / `Hr@2026`): click **Log in**. It runs on Render's free tier, so the first visit after 15 idle minutes takes about a minute to wake up, and the data resets to the seed on every restart.

## What it does

- **Employee records:** add, view, edit and delete employees.
- **Finding employees:** a paginated list with search, filters (country, job title, department) and sorting.
- **Salary insights:** by country, by job title within a country, by department, and an org-wide overview.
- **Seed data:** a script that creates 10,000 realistic employees.
- **Login:** one HR manager account.

Salaries are annual base pay in each country's local currency; totals and averages across countries are converted to USD at fixed exchange rates, set with `EXCHANGE_RATES` (decision 4). What is deliberately left out, and why, is listed in [`docs/requirements.md`](docs/requirements.md).

## Stack

| Part | Technology |
|---|---|
| Backend (`api/`) | Python 3.13, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic, SQLite |
| Frontend (`web/`) | React, TypeScript, Vite, Mantine, TanStack Query |
| Tests | pytest (backend), Vitest and React Testing Library (frontend) |
| Hosting | One Docker container on Render |

## Development

Prerequisites: [uv](https://docs.astral.sh/uv/) (it installs Python 3.13 for the project) and GNU make.

**API** (`api/`):

```bash
cd api
uv sync                                  # install the pinned dependencies
uv run alembic upgrade head              # create or update the local SQLite database
make seed                                # add 10,000 sample employees and the HR manager (each skipped if it exists)
uv run uvicorn app.main:app --reload     # run the API on http://localhost:8000
make check                               # lint, format, type check, tests with coverage
```

Copy `api/.env.example` to `api/.env` to override settings. The web dev server needs it:

- `ALLOWED_ORIGINS` lets `http://localhost:5173` call the API through CORS (and past the origin check).
- `COOKIE_SECURE=false` lets the session cookie work over plain http.
- `HR_MANAGER_EMAIL` and `HR_MANAGER_PASSWORD` are the login `make seed` creates. Every API route except login needs it.

**Web** (`web/`), with Node.js 22.22 or newer:

```bash
cd web
npm ci                # install the locked dependencies
npm run dev           # run the app on http://localhost:5173
npm run check         # ESLint, Stylelint, type check, tests
npm run build         # production build in web/dist
```

Copy `web/.env.example` to `web/.env` to point the app at the local API. Log in with the `HR_MANAGER_EMAIL` and `HR_MANAGER_PASSWORD` from `api/.env`; `VITE_DEMO_LOGIN_EMAIL` and `VITE_DEMO_LOGIN_PASSWORD` in `web/.env` fill them in for you.

After pulling changes, run `uv run alembic upgrade head` again: a database left on an older migration fails with errors such as `no such column`.

## Deployment (Render)

The root `Dockerfile` builds one image: it builds `web/`, installs the API with `uv sync --frozen`, and serves both from FastAPI. Its start command (`api/scripts/start.sh`) migrates the database, seeds it, then runs uvicorn on Render's `$PORT`.

1. In Render, create a **Web Service** from this repository, branch `master`, runtime **Docker**. Leave the build and start commands empty: the Dockerfile has them.
2. Set the **Health Check Path** to `/api/health`.
3. Add the environment variables:

   | Variable | Value |
   |---|---|
   | `HR_MANAGER_EMAIL`, `HR_MANAGER_PASSWORD` | The login the seed creates |
   | `EXCHANGE_RATES` | Optional: units of each currency per US dollar, as JSON (see `api/.env.example`). Defaults to the rates of 13 Nov 2026 |
   | `TRUST_FORWARDED_FOR` | `true`: Render's proxy appends the caller's IP to `X-Forwarded-For`, so the login rate limit can count per IP. Leave it unset anywhere without such a proxy |
   | `VITE_DEMO_LOGIN_EMAIL`, `VITE_DEMO_LOGIN_PASSWORD` | Optional: prefill the login form. Render passes them to the build, and they end up in the JavaScript, so use them only for a demo account |

   Leave `ALLOWED_ORIGINS`, `COOKIE_SECURE` and `VITE_API_URL` unset: the app and the API share one origin over https.
4. Deploy. Every push to `master` deploys again.

**SQLite on Render:** the database is a file inside the container. The free tier has no persistent disk, so the file starts empty on every deploy and restart, and the start command migrates and reseeds it: the demo always begins with the same 10,000 employees, and edits are lost on restart (decision 8). With a paid persistent disk, point `DATABASE_URL` at it (e.g. `sqlite:////var/data/salary_management.db`); the seed skips whatever already exists.

To try the image locally:

```bash
docker build -t salary-management .
docker run -p 8000:8000 -e HR_MANAGER_EMAIL=hr@example.com -e HR_MANAGER_PASSWORD='choose-one' -e COOKIE_SECURE=false salary-management
```

## Documentation

| Document | What it covers |
|---|---|
| [Requirements](docs/requirements.md) | Goal, scope, what is left out and why, success criteria |
| [Clarifications](docs/clarifications.md) | The questions asked before building, and the answers assumed |
| [Architecture](docs/architecture.md) | System and sequence diagrams, data model, API outline, open questions |
| [Design decisions](docs/decisions.md) | The key decisions and trade-offs, as short ADRs |
| [Implementation plan](docs/plan.md) | The build order as small, test-first steps |
| [Performance](docs/performance.md) | Measured seed and response times, query plans, bundle sizes, optimisations |
| [AI prompts and workflow log](docs/ai-workflow.md) | How AI was used, every prompt, and what I changed |
| [`CLAUDE.md`](CLAUDE.md) | The rules the AI follows: the general rules in [`docs/standards/`](docs/standards/) plus this project's rules; backend and frontend rules in [`api/CLAUDE.md`](api/CLAUDE.md) and [`web/CLAUDE.md`](web/CLAUDE.md) |
