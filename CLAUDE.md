# CLAUDE.md: Salary Management

A web app where an HR manager manages salary data for 10,000 employees across countries and sees how the org pays people. Requirements live in `docs/requirements.md`.

The general rules live in `docs/standards/` and are imported below; the rules in this file add to them or override them, with the reason.

@docs/standards/common.md

Backend rules load from `api/CLAUDE.md` and frontend rules from `web/CLAUDE.md` when working in those folders.

## Repo layout

```
salary-management/
├── api/            FastAPI project (SQLAlchemy + SQLite)
├── web/            React project (TypeScript + Vite + Mantine)
├── docs/           requirements, clarifications, architecture, decisions, plan, performance, AI workflow
│   └── standards/  general rules: common, FastAPI, React + TypeScript
├── Dockerfile      one image: builds web/, serves it from FastAPI (decision 8); Render builds this
├── docker-compose.yml  local run: web (nginx), api, and the SQLite volume (api/ and web/ Dockerfiles)
└── CLAUDE.md
```

## Project rules

- **Time zone and formats:** IST (UTC+05:30, a fixed offset; decision 15) everywhere: stored, sent by the API with the `+05:30` offset, and shown in the UI. Every date is shown as `DD/MM/YYYY`, in tables and date inputs alike.
- **Currency:** every salary is in its country's local currency, which the country sets (`COUNTRY_CURRENCIES`), so there is no currency column (decision 4). Figures that add up several countries are converted to USD with `CurrencyConverter`, at the fixed `EXCHANGE_RATES`; never add up salaries of two countries without it. Money columns are `Numeric(12, 2)`, rounded half-up to the cent (decision 19).
- **Personal data in this app:** salaries, emails, and names. Never logged or echoed in errors (see common rules).
- **Soft-deleted tables:** `employees` (`is_active` flag), filtered through `active_employees()` in `employee_repository.py` (decision 16). Email is unique only among active employees (a partial unique index).
- **Auth scope:** one HR manager, created by the seed script. No roles, sign-up, or password reset; 403 stays reserved for when roles exist.
- **Insights are tables and stat cards, not charts** (decision 11).
- **Deployment:** one Docker image on Render (decision 8), auto-deployed on every push to `master`. Work directly on `master` in small commits.
- **No CI** (decision 9): the local checks are the only gate before a push, and every push deploys. **NEVER** push without running them.
- **Commit scopes:** besides `api` and `web`, the features are `employees`, `insights`, `auth`, and `seed`.
- **Task log:** after every task, add an entry to `docs/ai-workflow.md`. It is a required submission artifact; write it as you go, never reconstructed at the end:
  ```
  ## <date> — <task>
  - Prompt / instruction given to the AI (short summary or quote)
  - What the AI produced
  - What I changed, rejected, or corrected, and why
  - How it was verified (tests, checks, manual run)
  ```
- **`docs/performance.md`** proves the performance claims in `docs/requirements.md`, measured against the full 10,000-employee seed:
  - seed script run time
  - response times of the list endpoint (with and without filters, search, and sort) and of each insights endpoint
  - `EXPLAIN QUERY PLAN` for the list and insights queries, showing the indexes are used
  - production bundle sizes (initial load and each lazy page chunk)
  - each optimisation applied, and the ones deliberately skipped with the reason (e.g. no list virtualisation, no keyset pagination, no insights cache)
