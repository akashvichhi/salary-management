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
uv run uvicorn app.main:app --reload     # run the API on http://localhost:8000
make check                               # lint, format, type check, tests with coverage
```

Copy `api/.env.example` to `api/.env` to override settings.

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
