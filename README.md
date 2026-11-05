# Salary Management

A web app where an HR manager manages salary data for 10,000 employees across countries, and answers questions about how the organisation pays people. Built for the Incubyte engineering assessment.

## What it does

- **Employee records:** add, view, edit and delete employees.
- **Finding employees:** a paginated list with search, filters (country, job title, department) and sorting.
- **Salary insights:** by country, by job title within a country, by department, and an org-wide overview.
- **Seed data:** a script that creates 10,000 realistic employees.
- **Login:** one HR manager account.

All salaries are annual base pay in USD. What is deliberately left out, and why, is listed in [`docs/requirements.md`](docs/requirements.md).

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

Copy `web/.env.example` to `web/.env` to point the app at the local API.

After pulling changes, run `uv run alembic upgrade head` again: a database left on an older migration fails with errors such as `no such column`.

## Documentation

| Document | What it covers |
|---|---|
| [Requirements](docs/requirements.md) | Goal, scope, what is left out and why, success criteria |
| [Clarifications](docs/clarifications.md) | The questions asked before building, and the answers assumed |
| [Architecture](docs/architecture.md) | System and sequence diagrams, data model, API outline, open questions |
| [Design decisions](docs/decisions.md) | The key decisions and trade-offs, as short ADRs |
| [Implementation plan](docs/plan.md) | The build order as small, test-first steps |
| [AI prompts and workflow log](docs/ai-workflow.md) | How AI was used, every prompt, and what I changed |
| [`CLAUDE.md`](CLAUDE.md) | The rules file the AI follows: structure, naming, API contract, testing and commits |
