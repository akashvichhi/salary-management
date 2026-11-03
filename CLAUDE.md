# CLAUDE.md: Salary Management

Rules for AI agents (and humans) working in this repo. **MUST** and **NEVER** are hard rules; everything else is the strong default.

Product: a web app where an HR manager manages salary data for 10,000 employees across countries and sees how the org pays people. Requirements live in `docs/requirements.md`.

Repo layout:

```
salary-management/
├── api/            Python FastAPI project (SQLAlchemy + SQLite)
├── web/            React project (TypeScript + Vite + Mantine)
├── docs/           requirements, architecture, decisions, AI workflow, performance
├── Dockerfile      one image: builds web/, serves it from FastAPI
└── CLAUDE.md       this rules file
```

"Backend" below means `api/`; "frontend" means `web/`.

---

## 1. Common rules (backend and frontend)

### Design
- **MUST** follow DRY: every piece of knowledge (a rule, a constant, a message, a type) has exactly one home. Extract a shared function, hook, or component the second time the same logic appears. Don't create abstractions for reuse that might happen later.
- **MUST** follow SOLID:
  - **Single responsibility:** one reason to change per file, class, or function. Routers handle HTTP, services hold business rules, repositories run queries, UI components render.
  - **Open/closed:** add behaviour by adding code (a new filter, a new insight) instead of editing `if/else` chains.
  - **Liskov:** subtypes and implementations are interchangeable without surprises.
  - **Interface segregation:** small, focused interfaces and props; no "god" objects.
  - **Dependency inversion:** depend on abstractions that are passed in (FastAPI `Depends`, hook parameters), not on concrete globals. That makes everything testable.
- Keep it simple. Build only what `docs/requirements.md` asks for. Don't add features or configuration options nobody requested.

### Organization and readability
- **MUST** keep the code well organized: each file sits in the folder of its layer (see the structures below). If it's unclear where a file belongs, the structure is wrong; fix the structure.
- File and folder names are **snake_case** on both sides (`employee_service.py`, `employee_table.tsx`).
- Functions are small and do one thing. Prefer early returns over nested `if`s.
- No magic numbers or strings: put them in named constants.
- Names describe intent (`calculateAverageSalary`, not `calc`). No abbreviations except well-known ones (`id`, `url`, `api`).
- Comments explain *why*, never *what*. No commented-out code. No dead code.
- Everything is typed: Python type hints checked by `mypy --strict`; TypeScript `strict: true`. **NEVER** use `any` (TS) or untyped `dict` payloads (Python) for domain data.

### Money and data
- **NEVER** use floats for money. Backend: `Decimal` / `Numeric(12, 2)`. Frontend: format as USD with `Intl.NumberFormat`. Every salary is in USD, so there is no currency field (see `docs/requirements.md`).
- Dates are ISO 8601 strings on the wire (`2026-10-31`).
- **Time zone:** the app uses **IST (Asia/Kolkata, UTC+05:30)** everywhere: stored, sent by the API (with the `+05:30` offset), and shown in the UI. It is one constant per app (backend `constants/time_constants.py`, frontend `src/constants/`). **NEVER** use the server's or the browser's local time zone.

### Security and configuration
- **NEVER** commit secrets or `.env` files. Commit a `.env.example` listing every variable.
- Configuration comes from environment variables, read in exactly one place per app (backend `core/config.py`, frontend `src/config/env.ts`).
- Authentication uses server-side sessions in **httpOnly cookies** (details in the backend and frontend sections). **NEVER** store tokens or session IDs anywhere JavaScript can read them.
- **Privacy:** salary data is sensitive personal data. **NEVER** log salaries, emails, names, or request/response bodies that contain them. Logs may contain IDs, routes, status codes, and timings only. Error messages never echo personal data back either.
- **Auth is in scope:** one HR manager, with no roles, sign-up, or password reset. Build it last, after the employee and insights features, so nothing else depends on it. Until then, don't create auth files or protect routes.

### Dependencies
- Lock files are **always committed**: `api/uv.lock` and `web/package-lock.json`. Installs in Docker use them (`uv sync --frozen`, `npm ci`).
- Pin exact versions; no `latest`.
- Add a library only when it clearly beats a few lines of our own code. Every new runtime dependency gets a one-line reason in `docs/decisions.md`.

### Docs and AI log
- **After every task**, add an entry to `docs/ai-workflow.md`:
  ```
  ## <date> — <task>
  - Prompt / instruction given to the AI (short summary or quote)
  - What the AI produced
  - What I changed, rejected, or corrected, and why
  - How it was verified (tests, checks, manual run)
  ```
  This log is a required submission artifact; write it as you go, never reconstructed at the end.
- A significant design decision or trade-off gets an ADR-style entry in `docs/decisions.md`: context, options considered, decision, consequences.
- **`docs/performance.md`** proves the performance claims in `docs/requirements.md` with measured numbers, never guesses. Measure against the full 10,000-employee seed:
  - seed script run time
  - response times of the list endpoint (with and without filters, search, and sort) and of each insights endpoint
  - `EXPLAIN QUERY PLAN` for the list and insights queries, showing the indexes are used
  - production bundle sizes (initial load and each lazy page chunk)
  - each optimisation applied, and the ones deliberately skipped with the reason (e.g. no list virtualisation, no keyset pagination, no insights cache)

  Write it once the backend and frontend are complete, and update it when a change affects these numbers.
- If behaviour or setup changes, update `README.md` or `docs/architecture.md` in the same commit.

### Testing and workflow
- **Test first (TDD):** write a failing test, make it pass, then refactor. Commits should show this order.
- Tests are fast, deterministic (no network, no real clock, fixed random seeds), independent, and named after the behaviour they check.
- While working, run only the tests related to the change (e.g. `uv run pytest tests/unit/services/test_employee_service.py`, `npx vitest run src/utils`).

### Quality checks (once, when the work is done)
- Run the full checks **once, after all the work for the task is finished and before committing**, not after each individual edit:
  - Frontend (`web/`): `npm run check` (ESLint + Stylelint + type check + tests)
  - Backend (`api/`): `make check` (`ruff check --fix` + `ruff format` + `mypy --strict` + `pytest`)
- Run only the side(s) the task touched. If a check fails, fix it and run the full check again.
- Definition of done: all checks pass, the docs are updated if behaviour changed, and the `docs/ai-workflow.md` entry is written.
- Coverage is enforced, not just reported: the `check` target in `api/Makefile` passes `--cov-fail-under=90`, so `make check` fails if coverage drops. It stays out of pytest's default options, because a single-file test run would otherwise fail on coverage.
- There is no CI pipeline: these local checks are the only gate before a push, and every push to `master` deploys. **NEVER** push without running them.

### Commits
- **One commit = one logical change.** Never mix a feature, a refactor, and a formatting change in one commit.
- **The TDD rhythm is visible in the history** for every behaviour:
  1. `test(employees): add failing test for duplicate email` (red)
  2. `feat(employees): reject duplicate email` (green)
  3. `refactor(employees): extract email normaliser` (only when there's something to refactor)
- A red commit (step 1) is allowed only when the green commit follows it directly. **NEVER push** a branch whose last commit fails the checks.
- **Message format** (Conventional Commits):
  ```
  <type>(<scope>): <summary in imperative mood, lowercase, no full stop, max 72 chars>

  <optional body: WHY the change was made, not what; wrap at 72>
  ```
  - Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore` (tooling, deps, config), `perf`, `style` (formatting only).
  - Scopes: `api`, `web`, or a feature (`employees`, `insights`, `auth`, `seed`), e.g. `feat(web/employees): add salary filter`.
- AI-assisted commits end with a `Co-Authored-By:` trailer naming the AI tool, so the history shows honestly where AI was used.
- **Stage files explicitly** (`git add api/app/services/employee_service.py ...`). **NEVER** `git add .` or `git add -A` without checking `git status` first.
- **NEVER commit:** `.env` files, `*.db` files, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`, coverage output. All of them go in `.gitignore` before the first commit that adds code or config.
- `.gitattributes` forces LF line endings, so ESLint's `unix` rule and Docker scripts also work on a Windows checkout.
- Docs change in the same commit as the behaviour they describe (or in a `docs:` commit right after it).
- Work directly on `master` in small commits. Push only after the checks pass.
- **AI agents NEVER commit or push without the user's explicit approval.** The user reviews every change first and may give more instructions before it is committed. For each commit:
  1. Finish the change (for a red commit: the failing test only).
  2. Stop and show: the files changed, a short summary of what changed and why, the proposed commit message, and the check results (for a red commit: the failing test output).
  3. Wait. If the user gives more instructions, apply them and show the result again.
  4. Commit only after the user says to commit (e.g. "commit", "looks good, commit"). Approval covers that one commit only, never later ones.
- The TDD rhythm still holds: the red (test) commit and the green (feat) commit are proposed and approved separately, in that order.
- Pushing needs its own explicit approval, every time.

---

## 2. Backend rules (FastAPI)

### Folder structure

```
api/
├── app/
│   ├── main.py                         app factory: creates FastAPI, registers routers and exception handlers
│   ├── core/
│   │   ├── config.py                   pydantic-settings Settings (the ONLY place env vars are read)
│   │   ├── database.py                 engine, session factory, get_db dependency
│   │   ├── exceptions.py               domain exceptions (NotFoundError, ConflictError, UnauthenticatedError, ...)
│   │   ├── exception_handlers.py       maps every exception to the { "error": ... } shape
│   │   ├── security.py                 password hashing (Argon2), session token generation and hashing
│   │   └── origin_check_middleware.py  CSRF protection: rejects write requests from foreign origins
│   ├── constants/
│   │   └── messages.py                 every user-facing message, in one place
│   ├── models/                         SQLAlchemy ORM models (tables only, no logic)
│   │   ├── employee_model.py
│   │   ├── user_model.py
│   │   └── session_model.py
│   ├── repositories/                   database access: queries, filtering, aggregation
│   │   ├── employee_repository.py
│   │   ├── user_repository.py
│   │   └── session_repository.py
│   ├── services/                       business logic
│   │   ├── auth_service.py             login, logout, resolve the current user from a session
│   │   ├── employee_service.py
│   │   └── salary_insight_service.py
│   ├── schemas/
│   │   ├── requests/                   input validation (body + query params)
│   │   │   ├── employee_request.py
│   │   │   ├── login_request.py
│   │   │   └── pagination_request.py
│   │   ├── resources/                  output shapes (serializers)
│   │   │   ├── employee_resource.py
│   │   │   ├── salary_insight_resource.py
│   │   │   └── user_resource.py
│   │   └── common/
│   │       └── response_schema.py      DataResponse[T], PaginatedResponse[T], ErrorResponse
│   └── api/
│       ├── dependencies.py             wires repositories and services for Depends(), incl. get_current_user
│       └── v1/
│           ├── api_router.py           includes all v1 routers under /api/v1
│           └── routers/                the "controllers"
│               ├── auth_router.py
│               ├── employee_router.py
│               ├── health_router.py    GET /api/health (mounted outside /api/v1)
│               └── salary_insight_router.py
├── migrations/                         Alembic
├── scripts/
│   ├── seed.py                         seeds 10,000 employees + the HR manager user (credentials from env)
│   └── data/                           first_names.txt, last_names.txt
├── tests/
│   ├── conftest.py                     in-memory SQLite, test client, fixtures
│   ├── factories.py                    deterministic test data builders
│   ├── unit/                           services and repositories, mirrors app/
│   └── integration/                    HTTP tests through the TestClient
├── pyproject.toml
└── .env.example
```

Auth files (`security.py`, `origin_check_middleware.py`, `user_*`, `session_*`, `auth_*`, `login_request.py`) are created when login is built, as the last feature (see Security and configuration).

### Naming
- Modules, functions, and variables: `snake_case`. Classes: `PascalCase`. Constants: `UPPER_SNAKE_CASE`.
- Every layer file is named `<entity>_<layer>.py` (`employee_model.py`, `employee_repository.py`, `employee_service.py`, `employee_router.py`). That way every "employee" file is easy to find, and editor tabs never show five files called `employee.py`.
- Classes follow the same pattern: `EmployeeRepository`, `EmployeeService`, `EmployeeCreateRequest`, `EmployeeResource`.
- Test files: `test_<module>.py`. Test functions: `test_<behaviour>`, e.g. `test_create_employee_rejects_duplicate_email`.

### Layer responsibilities (one job per layer)

| Layer | Does | NEVER does |
|---|---|---|
| Router (controller) | Declares the route, parses the request via request schemas, calls ONE service method, returns a resource with the right status code | Business logic, queries, `if` rules about the domain |
| Request schema | Validates shape and format (types, required fields, ranges, enums, ISO codes) | Database lookups |
| Service | Business rules (e.g. unique email, employee exists), orchestration, transactions | SQL details, HTTP concerns (**NEVER** raises `HTTPException`; raises domain exceptions) |
| Repository | Queries, filters, sorting, pagination, SQL aggregation | Business decisions |
| Resource schema | Defines exactly which fields leave the API | Logic or computed business values |
| Model | Table columns, indexes, constraints | Logic |

- Services raise domain exceptions from `core/exceptions.py`. `core/exception_handlers.py` maps them to status codes (`NotFoundError` → 404, `ConflictError` → 409, `DomainValidationError` → 422).
- Services and repositories receive their dependencies through constructors and are wired with `Depends()` in `api/dependencies.py`. Tests can then pass in an in-memory database.
- Routers **NEVER** return ORM models; they always return a resource schema.

### REST conventions
- Base path `/api/v1`. Resources are plural nouns in kebab-case: `/employees`, `/salary-insights`.
- Verbs:

| Action | Method and path | Success |
|---|---|---|
| List | `GET /employees?page=1&per_page=20&search=&country=&job_title=&department=&sort=-salary` | 200 |
| Get one | `GET /employees/{id}` | 200 |
| Create | `POST /employees` | 201 |
| Update (partial) | `PATCH /employees/{id}` | 200 |
| Delete | `DELETE /employees/{id}` | 204 (no body) |

- Query parameters and JSON keys are `snake_case`.
- Sorting: `sort=<field>` ascending, `sort=-<field>` descending. Sort fields are an allow-listed enum.
- **NEVER** use data values as JSON object keys (e.g. `{ "India": {...} }`). Return arrays of objects (`[{ "country": "India", ... }]`). That keeps responses typed, ordered, and safe for the frontend's case conversion.

### Response contract (identical for every endpoint)

Single resource:
```json
{ "data": { "id": 1, "full_name": "Asha Rao", "salary": "85000.00" } }
```

List (paginated):
```json
{
  "data": [ { "id": 1, "full_name": "Asha Rao" } ],
  "meta": { "total_count": 10000, "current_page": 1, "per_page": 20, "total_pages": 500 }
}
```

Error (every 4xx and 5xx):
```json
{ "error": "Employee not found" }
```

Validation error (422) may add field-level `details`, so the UI can highlight the right input:
```json
{
  "error": "Validation failed",
  "details": [ { "field": "salary", "message": "Salary must be greater than 0" } ]
}
```

- **MUST** override FastAPI's default `{ "detail": ... }` errors by registering handlers for `RequestValidationError`, `starlette.exceptions.HTTPException` (this also covers unknown routes), the domain exceptions, and `Exception`.
- 500 responses return a generic message and log the stack trace. **NEVER** leak internals (SQL, file paths) to the client.
### Serving the frontend and health check
- In production, FastAPI serves the built React app from `web/dist` (copied into the Docker image):
  - `/assets/*` → static files with `Cache-Control: public, max-age=31536000, immutable` (safe: file names are content hashes). A **missing** asset returns a plain **404**, **never** `index.html`, so a stale app gets a clear "file not found" it can detect, not HTML pretending to be JavaScript
  - `/api/*` → the API. An unknown `/api/*` path returns a JSON 404 `{ "error": ... }`, **never** `index.html`
  - **any other path** → `index.html`, so React Router handles it and refreshing the page on `/employees` works
- `index.html` is always sent with `Cache-Control: no-cache`, so every load or reload checks for the newest version. Without this, reloading after a deploy could bring back the old `index.html` from the browser cache and request files that no longer exist.
- The API router is registered **before** the frontend fallback, so the fallback can never shadow an API route.
- `GET /api/health` (outside `/api/v1`, no auth) returns `200 { "data": { "status": "ok" } }` after a cheap database check (`SELECT 1`). Render uses it as the health check path.
- In local development the frontend runs on Vite's dev server, and FastAPI serves only the API.

### Pagination
Every paginated endpoint uses the same two generic schemas. They mirror the frontend's `IPaginationParams` / `IPaginatedResponse<T>` field for field (snake_case here, camelCase there after the interceptor).

```python
# schemas/requests/pagination_request.py
class PaginationRequest(BaseModel):
    page: int = Field(default=DEFAULT_PAGE, ge=1)
    per_page: int = Field(default=DEFAULT_PER_PAGE, ge=1, le=MAX_PER_PAGE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page
```
```python
# schemas/common/response_schema.py
T = TypeVar("T")


class PaginationMeta(BaseModel):
    total_count: int
    current_page: int
    per_page: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta

    @classmethod
    def create(cls, items: list[T], total_count: int, pagination: PaginationRequest) -> "PaginatedResponse[T]":
        total_pages = math.ceil(total_count / pagination.per_page)
        return cls(
            data=items,
            meta=PaginationMeta(
                total_count=total_count,
                current_page=pagination.page,
                per_page=pagination.per_page,
                total_pages=total_pages,
            ),
        )
```

- Defaults live in `constants/`: `DEFAULT_PAGE = 1`, `DEFAULT_PER_PAGE = 20`, `MAX_PER_PAGE = 100`. `per_page` above the max → 422.
- A list endpoint's query schema **extends** `PaginationRequest` with its own filters (e.g. `EmployeeListRequest(PaginationRequest)` adds `search`, `country`, `job_title`, `department`, `sort`), and its route declares `response_model=PaginatedResponse[EmployeeResource]`, mirroring `IPaginatedResponse<IEmployee>`.
- The repository returns `(items, total_count)`, using `pagination.offset` and `pagination.per_page`. The service builds the response **only** with `PaginatedResponse.create(...)`. **NEVER** build `meta` by hand or redefine these fields per feature.
- Edge cases: 0 results → `data: []`, `total_pages: 0`. A page beyond the last → `200` with `data: []` and the real `meta` (not a 404), so the frontend can step back a page.

### Authentication (server-side sessions in httpOnly cookies)
- **Mechanism:** on login the server creates a session row and sets a cookie holding only a random session ID. **NEVER** use JWTs or bearer tokens for the browser, and **NEVER** return a token or session ID in a response body.
- **Session ID:** generated with `secrets.token_urlsafe(32)`. The database stores only its **SHA-256 hash**, so a database leak doesn't expose live sessions.
- **Cookie:** `HttpOnly; Secure; SameSite=Lax; Path=/`, with `Max-Age` equal to the session lifetime. Name, lifetime, and the `Secure` flag come from `core/config.py` (`SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS` default 8, `COOKIE_SECURE` true everywhere except local development).
- **Endpoints:**

| Action | Method and path | Success | Failure |
|---|---|---|---|
| Log in | `POST /api/v1/auth/login` | 200 `{ "data": <user> }` + `Set-Cookie` | 401 `{ "error": "Invalid email or password" }` |
| Log out | `POST /api/v1/auth/logout` | 204, session row deleted, cookie cleared | none (always succeeds) |
| Current user | `GET /api/v1/auth/me` | 200 `{ "data": <user> }` | 401 |

- **Login rules:**
  - The same generic error for a wrong email or a wrong password, so the API doesn't reveal which emails exist.
  - A new session ID on every login (prevents session fixation).
  - Rate-limit failed attempts per email and IP (e.g. 5 per 15 minutes) → 429.
- **Passwords:** hashed with Argon2 in `core/security.py`. **NEVER** stored or logged in plain text. **NEVER** returned by any resource.
- **Protecting routes:** `get_current_user` (in `api/dependencies.py`) reads the cookie, calls `auth_service`, and raises `UnauthenticatedError` (→ 401) for a missing, unknown, or expired session. Apply it at **router level** (`APIRouter(dependencies=[Depends(get_current_user)])`), so a new endpoint can't be left unprotected by accident. Only `login` is public.
- **401 vs 403:** 401 = not logged in or session expired. 403 = logged in but not allowed (reserved for when roles exist).
- **CSRF protection:**
  - `SameSite=Lax` on the cookie.
  - `origin_check_middleware.py` rejects `POST`/`PATCH`/`PUT`/`DELETE` requests whose `Origin` header is not in `ALLOWED_ORIGINS` → 403.
  - `GET` endpoints **NEVER** change data.
- **CORS** (local development only, where `web` and `api` run on different ports): `allow_origins` = `ALLOWED_ORIGINS` (an explicit list, **NEVER** `*`), `allow_credentials=True`. In production FastAPI serves the frontend from the same origin, so CORS isn't involved.
- Expired sessions are rejected and deleted when they are used.

### Data and performance
- Aggregations (min/max/avg/count per country or job title) run in **SQL** (`GROUP BY`), never by loading 10,000 rows into Python. Exception: median and percentiles, which SQLite doesn't support; compute those in Python on the filtered rows and note the decision in `docs/decisions.md`.
- Add indexes on every column used for filtering, sorting, or grouping (`country`, `job_title`, `department`, `salary`, `email` unique), plus a **composite index on `(country, job_title)`** for "average salary per job title within a country". Every index has a one-line reason in `docs/architecture.md`.
- **Endpoints are plain `def`, not `async def`.** SQLAlchemy with SQLite is synchronous; FastAPI runs `def` endpoints in a thread pool, while a blocking database call inside `async def` freezes the event loop for every request. Use `async def` only for code that awaits truly async I/O.
- **Responses are compressed** with `GZipMiddleware` (registered in `main.py`, with a `minimum_size` so tiny responses skip it).
- The seed script uses bulk inserts and a fixed random seed, so it is fast and produces the same data every time.
- Schema changes go through Alembic migrations, never `create_all()` in production code.
- **SQLite settings**, applied on every connection in `core/database.py`: `PRAGMA foreign_keys = ON` (SQLite ignores foreign keys otherwise) and `PRAGMA journal_mode = WAL` (reads aren't blocked by a write).
- **Timestamps:** every table has `created_at` and `updated_at`, stored in **IST** (`APP_TIMEZONE` in `constants/time_constants.py`), set by the database layer (column defaults / `onupdate`), never by hand in services. The API returns them as ISO 8601 with the `+05:30` offset (`2026-01-01T14:30:00+05:30`).
- **Input normalisation** happens in request schemas (Pydantic validators), so the service and the database only ever see clean data:
  - trim leading and trailing spaces on every text field; reject strings that are empty after trimming
  - lowercase emails, so uniqueness can't be bypassed with `Asha@X.com` vs `asha@x.com`
  - uppercase ISO country codes (`IN`) and validate them against the allowed list
- Uniqueness is enforced **twice**: a unique index in the database (the guarantee) and a service check (the friendly 409 message).

### Testing
- `pytest` + `pytest-cov`. Unit tests for services and repositories (in-memory SQLite). Integration tests for the HTTP contract, including the error shape.
- Each test builds its own data with `tests/factories.py`. Tests never depend on the seed data or on each other.
- Aim for 90%+ coverage of `services/` and `repositories/`.
- Auth tests MUST cover:
  - login sets the cookie with `HttpOnly`, `SameSite=Lax`, and `Secure` (when enabled)
  - wrong email and wrong password return the same 401
  - a protected endpoint returns 401 with no cookie and with an expired session
  - logout invalidates the session
  - the origin check rejects a write from a foreign origin
  - the rate limit returns 429
- Use an `authenticated_client` fixture so other tests don't repeat the login steps.

### Tooling
- Python 3.13, managed with `uv`.
- `ruff check` + `ruff format` (lint and format), `mypy --strict` (types), `pytest` (tests). `api/Makefile` has a `check` target running all four; it must pass before a commit.

---

## 3. Frontend rules (React + TypeScript)

### Folder structure

```
web/src/
├── main.tsx                         entry: providers (Mantine, QueryClient, Router)
├── config/
│   └── env.ts                       the ONLY file that reads import.meta.env
├── api/
│   ├── api_client.ts                axios instance + interceptors (case conversion, error normalisation, 401 handling)
│   ├── auth_api.ts
│   └── employee_api.ts              API functions, one per endpoint
├── types/
│   ├── api_response.ts              IApiResponse<T>, IApiError, IFieldError
│   ├── auth.ts                      IUser, ILoginFormValues
│   ├── pagination.ts                IPaginationMeta, IPaginatedResponse<T>, IPaginationParams
│   └── employee.ts                  IEmployee, IEmployeeFormValues, IEmployeeListParams
├── queries/                         React Query hooks, ONE file per resource (all its queries + mutations)
│   ├── auth_queries.ts              useCurrentUserQuery, useLoginMutation, useLogoutMutation
│   └── employee_queries.ts          useEmployeesQuery, useEmployeeQuery, useCreate/Update/DeleteEmployeeMutation
├── hooks/                           shared business logic hooks, one hook per file
│   ├── use_debounced_value.ts
│   ├── use_global_error_listener.ts window error / unhandledrejection → log + one notification
│   └── use_list_url_state.ts        page, filters, search, sort ↔ URL query string
├── constants/
│   ├── api_endpoints.ts
│   ├── query_keys.ts
│   └── employee_constants.ts
├── validations/
│   ├── employee_form_validation.ts
│   └── login_form_validation.ts
├── utils/
│   ├── case_converter.ts            camelCase ↔ snake_case (pure functions)
│   ├── is_chunk_load_error.ts       detects a failed lazy-chunk download (stale deploy)
│   ├── reload_for_new_version.ts    the ONLY place that reloads for a new version, with the loop guard
│   └── format_currency.ts
├── styles/
│   ├── global.scss                  only if needed: resets and base element styles (imported once in main.tsx)
│   ├── theme.ts                     Mantine theme: same spacing / font / breakpoint scale as the tokens
│   └── shared/
│       └── style_system/            only if needed: design tokens, the ONLY place raw style values live
│           ├── _spacing.scss
│           ├── _typography.scss
│           ├── _colors.scss
│           └── _breakpoints.scss
├── routes/
│   ├── route_paths.ts               path constants and path builder functions
│   ├── app_router.tsx               lazy-loaded route definitions
│   ├── route_boundary.tsx           ErrorBoundary + Suspense wrapper used by every route
│   └── protected_route.tsx          session check: full-screen loader, then the page or a redirect to login
├── ui/                              reusable, logic-free UI building blocks
│   ├── form/                        text_field.tsx, select_field.tsx, ...
│   ├── layout/                      app_shell.tsx, page_header.tsx
│   ├── feedback/                    empty_state.tsx, error_state.tsx, error_fallback.tsx, root_error_fallback.tsx, full_screen_loader.tsx
│   └── skeletons/                   table_skeleton.tsx, card_skeleton.tsx, form_skeleton.tsx, page_skeleton.tsx
├── common/                          feature components shared by 2+ pages/routes
│   └── employee_form/               e.g. employee_form.tsx used by the create and edit routes
└── pages/                           one folder per route
    ├── login/
    │   └── login_page.tsx
    ├── employee_list/
    │   ├── employee_list_page.tsx
    │   ├── components/              components used only by this page
    │   └── hooks/                   logic used only by this page, one hook per file
    └── salary_insights/
        └── salary_insights_page.tsx
```

Auth files (`auth_api.ts`, `types/auth.ts`, `auth_queries.ts`, `login_form_validation.ts`, `protected_route.tsx`, `pages/login/`) are created when login is built, as the last feature. Until then, the full-screen loader isn't used.

### Naming
- Files and folders: `snake_case` (`employee_table.tsx`, `use_debounced_value.ts`).
- Components: `PascalCase` (`EmployeeTable`). Hooks: `camelCase` starting with `use` (`useEmployeesQuery`). Functions and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- Interfaces: `I` prefix + `PascalCase` (`IEmployee`, `IPaginatedResponse<T>`), with `camelCase` properties (`fullName`, `hireDate`).
- Type aliases: `T` prefix + `PascalCase` (`TSortOrder = 'asc' | 'desc'`, `TEmployeeSortField`).
- Use an `interface` for object shapes and a `type` for unions, literals, and function signatures. Generic type parameters stay single letters (`<T>`) and take no prefix.
- **NEVER** leave anything untyped, even where TypeScript could infer it:
  - Every variable and constant: `const pageSize: number = 20`
  - Every `useState`, `useRef`, and `useMemo`: `useState<string>('')`, `useState<IEmployee | null>(null)`, `useRef<HTMLInputElement>(null)`, `useMemo<IEmployee[]>(() => ..., [...])`
  - Every function: parameters and return type (`function formatSalary(amount: string): string`); components return `React.JSX.Element` (React 19 removed the global `JSX` namespace)
  - Every callback: `useCallback((id: number): void => { ... }, [...])`
  - Every component's props, through an `I<Component>Props` interface (`IEmployeeTableProps`)
  - Every API function and hook return type (`Promise<IEmployee>`, `UseQueryResult<IPaginatedResponse<IEmployee>>`)
- Business logic hooks (`src/hooks/`, `pages/<page>/hooks/`): one hook per file, and the file name matches the hook (`use_debounced_value.ts` → `useDebouncedValue`).
- React Query hooks (`src/queries/`): one file per resource, named `<resource>_queries.ts`. Read hooks end in `Query` (`useEmployeesQuery`); write hooks end in `Mutation` (`useDeleteEmployeeMutation`).
- Pages use a `default` export (required by `React.lazy`). Everything else uses named exports.

### Environment and API client
- `.env` defines `VITE_API_URL` once (Vite only exposes variables prefixed with `VITE_`). `src/config/env.ts` is the only file that reads it:
  ```ts
  export const API_URL: string = import.meta.env.VITE_API_URL || '/'
  ```
  In production FastAPI serves the frontend from the same origin, so `VITE_API_URL` is left unset and `/` is used.
- `api/api_client.ts` creates ONE axios instance with `baseURL: API_URL`. All requests go through it. **NEVER** call `axios` or `fetch` directly elsewhere.
- Endpoint paths live in `constants/api_endpoints.ts` (e.g. `EMPLOYEES: 'api/v1/employees'`, `employeeById: (id: number) => \`api/v1/employees/${id}\``).

### snake_case ↔ camelCase conversion
- The conversion happens **once, in axios interceptors** in `api_client.ts`, not inside each API function:
  - **Response interceptor:** converts response body keys snake_case → camelCase.
  - **Request interceptor:** converts request body keys and query `params` keys camelCase → snake_case.
- Conversion functions live in `utils/case_converter.ts` as pure, recursive functions over plain objects and arrays. They skip `FormData`, `Blob`, and `Date`.
- Only **keys** are converted, never values. Values the API expects in snake_case (e.g. sort fields like `hire_date`) are defined as constants in that form.
- This only works because the backend never uses data as object keys (see backend REST conventions).
- **One exception to "keys only":** in a 422 error, `details[].field` is a field name sent as a value (`"hire_date"`). The error interceptor converts it to camelCase (`"hireDate"`), so it matches the form field name and `form.setFieldError` works.
- The error interceptor converts any failure into an `IApiError` (`{ error: string, details?: IFieldError[] }`), with a fallback message for network errors. Components never inspect raw axios errors.

### Authentication
- The browser holds the session in an httpOnly cookie that JavaScript can't read. The frontend **NEVER** sees, stores, or sends a token itself.
- **NEVER** put auth data in `localStorage`, `sessionStorage`, or a JS-readable cookie. The current user lives only in the React Query cache (`useCurrentUserQuery`).
- `api_client.ts` sets `withCredentials: true`, so the cookie is also sent in local development, where `web` and `api` run on different ports.
- **App start:** `protected_route.tsx` runs `useCurrentUserQuery` (`GET /api/v1/auth/me`):
  - while it loads → `full_screen_loader.tsx`
  - 200 → render the page
  - 401 → redirect to the login route, remembering the page the user wanted
- **Session expiry:** the response interceptor handles any 401 (except from `/auth/me` and `/auth/login`) by clearing the React Query cache and redirecting to login.
- **Login:** `useLoginMutation` → on success, put the returned user into the `useCurrentUserQuery` cache and navigate to the remembered page. Show the generic error from the API; **NEVER** say whether the email or the password was wrong.
- **Logout:** `useLogoutMutation` → on success, clear the whole React Query cache and navigate to login.

### Types
- `types/pagination.ts` holds the generic pagination types used by EVERY paginated API:
  ```ts
  export interface IPaginationMeta {
    totalCount:  number
    currentPage: number
    perPage:     number
    totalPages:  number
  }

  export interface IPaginatedResponse<T> {
    data: T[]
    meta: IPaginationMeta
  }

  export interface IPaginationParams {
    page:    number
    perPage: number
  }
  ```
- A list's params interface **extends** `IPaginationParams` with its own filters (`IEmployeeListParams extends IPaginationParams`), mirroring the backend's `EmployeeListRequest(PaginationRequest)`.
- If a response comes back with `data: []` and `currentPage > totalPages > 0` (e.g. the last item on the last page was deleted), go to page `totalPages`.
- A specific API combines it with its own type: `IPaginatedResponse<IEmployee>`. **NEVER** redefine pagination fields per feature.
- Money arrives as a decimal **string** (`"85000.00"`), so `IEmployee.salary` is a `string`. **NEVER** do arithmetic on it with `Number`/`parseFloat`; the backend computes all aggregates, and the frontend only formats.
- API functions are fully typed: `getEmployees(params: IEmployeeListParams): Promise<IPaginatedResponse<IEmployee>>`. Single-resource functions unwrap `data` and return `Promise<IEmployee>`.

### Data fetching (React Query)
- Flow: **types → api functions → query/mutation hooks → components**. Components **NEVER** call API functions directly.
- All React Query hooks for one resource live together in `src/queries/<resource>_queries.ts`: the list and detail queries plus the create, update, and delete mutations. The resource's invalidation and cache updates then stay in one file.
- **All** query keys for every resource live in ONE file, `constants/query_keys.ts`, as one factory per resource (e.g. `employeeKeys.list(params)`, `employeeKeys.detail(id)`, `salaryInsightKeys.byCountry()`). **NEVER** write an inline key array like `['employees', id]` in a hook; always use the factory, so invalidation is reliable.
- Mutations invalidate the affected query keys on success.
- Paginated lists use `placeholderData: keepPreviousData`, so the table doesn't flash empty between pages.
- The `QueryClient` sets a default `staleTime` (`QUERY_STALE_TIME_MS`, e.g. 30 seconds, from constants), so moving between pages doesn't refetch data that is still fresh. Mutations still invalidate what they change, so edits always show immediately.

### Logic vs UI
- **All logic lives in hooks.** Shared logic goes in `src/hooks/`; logic used by one page goes in `pages/<page>/hooks/`.
- Components in `src/ui/` render UI only: props in, JSX and callbacks out. No API calls, no business rules, no React Query.
- Create a `src/ui/` wrapper when it standardises behaviour or is used in 2+ places (e.g. `ui/form/text_field.tsx` wrapping Mantine's `TextInput` with consistent error display). Otherwise use Mantine directly; don't wrap every component by default.
- Page components compose hooks and UI; they stay thin.
- Where a component goes depends on who uses it:

| Used by | Folder | Example |
|---|---|---|
| One page only | `pages/<page>/components/` | `employee_table.tsx` |
| 2+ pages or routes | `src/common/<component>/` | `employee_form/` (create and edit) |
| Anywhere, generic, no domain knowledge | `src/ui/` | `ui/form/select_field.tsx` |

- A component starts in its page folder. When a second page or route needs it, **move** it to `src/common/`; **NEVER** copy it or import it from another page's folder.
- `src/common/` components know the domain (employees, salaries) and may use hooks from `src/hooks/` or `src/queries/`; their logic still lives in those hooks, not in the component. `src/ui/` components never do either.

### Loading states
| Situation | Loader |
|---|---|
| First app load only, while the session is checked (`GET /api/v1/auth/me`) | `ui/feedback/full_screen_loader.tsx`. **NEVER** used anywhere else |
| Lazy route loading | `ui/skeletons/page_skeleton.tsx` |
| A query loading data (table, cards, detail, insights) | A skeleton shaped like the content it replaces (`table_skeleton.tsx`, `card_skeleton.tsx`, `form_skeleton.tsx` for edit forms waiting on data) |
| Paginating, filtering, or searching a list that already has data | Keep the current rows visible (`keepPreviousData`) with a subtle fetching indicator; don't swap back to the skeleton |
| Form submit (create, update) | The submit button only: Mantine `<Button loading={mutation.isPending}>`, which disables it and shows a spinner. The rest of the form stays visible |
| Delete or any other action button | The same: that button shows `loading` and is disabled while the mutation is pending |

- **NEVER** use a full-screen or page-blocking spinner for queries or mutations.
- Skeletons are built from Mantine's `Skeleton` and match the final layout (same rows, columns, and card sizes), so nothing jumps when the data arrives.
- A disabled, loading button prevents double submits. **NEVER** rely on the user not clicking twice.

### User feedback and UX
- **URL holds the list state:** page, page size, search, filters, and sort live in the URL query string (`/employees?page=3&country=IN&sort=-salary`), read and written through ONE shared hook (`hooks/use_list_url_state.ts`). Refreshing, the back button, and sharing a link all keep the view. Changing a filter or search resets to page 1.
- **Notifications** (`@mantine/notifications`) after every mutation: success ("Employee added") and failure (the API's `error` message). Messages come from a constants file, never inline strings. Wire this once in the mutation hooks (or a shared helper), not in every component.
- **Delete always asks first:** a confirmation modal (`@mantine/modals`) naming the employee. The confirm button shows the loading state while the delete runs.
- **Errors are visible:** a failed query shows `ui/feedback/error_state.tsx` with a retry button. An empty result shows `ui/feedback/empty_state.tsx` with a hint (e.g. "No employees match these filters" + "Clear filters").
- **Accessibility:**
  - every input has a visible `label` (never placeholder-only)
  - icon-only buttons have an `aria-label`
  - every action works with the keyboard alone
  - status is never shown by colour alone

### Styling: Mantine first, then SCSS

**Order of preference** for any layout or style (use the first one that works):
1. **Mantine components.** Build layout and structure from Mantine: `Flex`, `Group`, `Stack`, `Center`, `Container`, `Space`, `SimpleGrid`, `Grid`, `Paper`, `Card`, `Divider`, `Title`, `Text`, `Badge`, `Table`, `Skeleton`, etc. **NEVER** write a custom `div` + CSS for something a Mantine component already does (e.g. a flex row → `Group`, centring → `Center`, a card grid → `SimpleGrid`).
2. **Mantine's own options:** component props (`variant`, `size`, `color`, `radius`), then its Styles API `classNames` prop pointing at an SCSS module class.
3. **Custom SCSS module:** only when the design needs something Mantine can't express. Always uses tokens.
4. **Inline `style`:** only for a value known only at runtime (see "No inline styles").

**Mantine props take theme keys only:**
- ✅ `<Stack gap="md">`, `<SimpleGrid cols={3} spacing="lg">`, `<Space h="xl" />`, `<Text c="dimmed" size="sm">`, `mt="md"`
- ❌ `mt={15}`, `p="13px"`, `c="#333"`, `gap={10}`: raw values are banned, exactly as in SCSS
- `src/styles/theme.ts` configures Mantine's spacing, font sizes, and breakpoints. Once SCSS tokens exist, both use the **same** scale, so `gap="md"` equals `spacing.$md`, and changing one means updating the other in the same commit.

**Custom CSS is the exception, not the default.** Most screens should need no SCSS at all. Everything below applies only **when** custom CSS is genuinely needed:
- **NEVER** create token files, `global.scss`, or SCSS modules up front "just in case".
- When the first SCSS module is needed, create only the token file(s) it uses (e.g. just `_spacing.scss`), using the values below as the starting scale. Add the other token files the same way, when first needed.

**Tokens** live in `src/styles/shared/style_system/`, one file per concern. They are the only place raw values appear:

```scss
// _spacing.scss: 4px scale, even values only
$xxs: 4px;
$xs:  8px;
$sm:  12px;
$md:  16px;
$lg:  24px;
$xl:  32px;
$xxl: 48px;
```
```scss
// _typography.scss
$font-family:      system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
$size-xs:          12px;
$size-sm:          14px;
$size-md:          16px;
$size-lg:          18px;
$size-xl:          20px;
$size-xxl:         24px;
$weight-regular:   400;
$weight-medium:    500;
$weight-semibold:  600;
$weight-bold:      700;
$line-height-tight:  1.25;
$line-height-normal: 1.5;
```
```scss
// _colors.scss: semantic names mapped to Mantine CSS variables,
// so light/dark mode and Mantine components always match
$text-primary:   var(--mantine-color-text);
$text-secondary: var(--mantine-color-dimmed);
$surface:        var(--mantine-color-body);
$surface-hover:  var(--mantine-color-default-hover);
$border:         var(--mantine-color-default-border);
$primary:        var(--mantine-primary-color-filled);
$danger:         var(--mantine-color-red-filled);
$success:        var(--mantine-color-green-filled);
```
```scss
// _breakpoints.scss: same values as Mantine's breakpoints (media queries can't use CSS variables)
$xs: 36em;
$sm: 48em;
$md: 62em;
$lg: 75em;
$xl: 88em;
```

**Using tokens:**
- Load tokens with `@use`, the `@src` alias, and a namespace named after the file. `@use` rules come first in the file. **NEVER** use `@import` (deprecated in Sass).
  ```scss
  @use "@src/styles/shared/style_system/spacing" as spacing;
  @use "@src/styles/shared/style_system/typography" as typography;
  @use "@src/styles/shared/style_system/colors" as colors;
  ```
- **NEVER** hardcode a value for spacing (margin, padding, gap, insets), font size, weight, family, line height, colour, or breakpoint: `padding: 15px` ❌ → `padding: spacing.$md` ✅.
- If no token fits, **add one** to the right token file (an even value that fits the scale), then use it. Never add a one-off value in a component.
- Allowed literals: `0`, `1px` for borders, percentages, `auto`/`none`/`inherit`/`transparent`/`currentColor`, and unitless `opacity`/`flex`/`z-index` values.

**SCSS modules:**
- SCSS only; we write no `.css` files (Mantine's own stylesheet import is the exception).
- **One SCSS module per component**, named after the component file and placed next to it: `employee_table.tsx` → `employee_table.module.scss`, imported as `import styles from './employee_table.module.scss'`. **NEVER** a shared `styles.module.scss` for several components, and never import another component's module.
- Class names are camelCase (`.employeeRow`), so they read as `styles.employeeRow`.
- **Nest** child elements, states, and modifiers under their parent, at most **3 levels** deep:
  ```scss
  .tableWrapper {
    padding: spacing.$md;
    border: 1px solid colors.$border;

    .title {
      margin-bottom: spacing.$sm;
      font-size: typography.$size-lg;
      font-weight: typography.$weight-semibold;
    }

    &:hover {
      background: colors.$surface-hover;
    }

    &.isSelected {
      border-color: colors.$primary;
    }
  }
  ```
- **NEVER** use ID selectors or `!important`, and never style bare elements (`div`, `span`) inside modules; style classes.
- Style Mantine internals through its `classNames` prop (Styles API). `:global` only as a last resort, with a comment saying why.
- Global styles (resets, `body`) live only in `src/styles/global.scss`.

**No inline styles:**
- **NEVER** use `style={{ ... }}` for static styling; use Mantine props (theme keys) or a module class.
- **Only exception:** a value known only at runtime (e.g. a bar width from data). Pass it as a CSS custom property and use it in SCSS:
  ```tsx
  <div className={styles.bar} style={{ '--bar-width': `${percent}%` } as React.CSSProperties} />
  ```
  ```scss
  .bar { width: var(--bar-width); }
  ```

**Combining classes:** always with the `classnames` library, **never** with template strings or `+`:
```tsx
import classNames from 'classnames'

<tr className={classNames(styles.row, { [styles.isSelected]: isSelected })} />
```

### Constants and validation
- Constants (page sizes, sort options, country list, debounce delay) go in `src/constants/`, one file per domain.
- Form validation rules go in `src/validations/` and are used by `@mantine/form`. Limits come from constants (e.g. `MIN_SALARY`), never inline numbers.
- Frontend validation exists for user experience only; the backend is the source of truth. Server field errors (`details`) are shown on the matching form inputs.

### Error boundaries
Error boundaries catch **unexpected rendering errors** (bugs), so one broken component shows a friendly message instead of a blank white screen.

**Library:** `react-error-boundary` (`ErrorBoundary`, `FallbackProps`). It avoids writing class components and supports reset. Note its reason in `docs/decisions.md`, like every new dependency.

**Goal: no JavaScript error may ever leave the user on a blank screen.** Three boundary levels plus two safety nets, all required.

**Boundary levels:**

| Level | Where | Catches | Fallback |
|---|---|---|---|
| **Root** (last resort) | `main.tsx`: the **outermost** element, outside every provider (`MantineProvider`, `QueryClientProvider`, router) | Crashes in the providers or theme setup, and errors thrown by the app-level fallback itself | `ui/feedback/root_error_fallback.tsx`: plain, unstyled HTML (a heading, one sentence, and a "Reload" link to `/`). **NEVER** uses Mantine or anything else that could fail |
| **App** | `main.tsx`: inside `MantineProvider`, around the router | Anything no lower boundary caught (layout, providers, router) | `ui/feedback/error_fallback.tsx`, full page, with a "Reload" button (`window.location.reload()`) |
| **Route** | `routes/route_boundary.tsx`: wraps **every** lazy page as `ErrorBoundary` → `Suspense` (page skeleton) → page | Errors inside one page; the app shell and navigation keep working | `error_fallback.tsx` inside the page area, with a "Try again" button (`resetErrorBoundary`) |

- The route boundary resets automatically on navigation: `resetKeys={[location.pathname]}`, so leaving a broken page clears the error.
- If the router is a data router (`createBrowserRouter`), also set the **root route's `errorElement`** to the same fallback, so React Router's default developer error screen never shows.
- **Section level (optional):** wrap an independent widget (e.g. one insights card) in its own `ErrorBoundary` only when one widget failing shouldn't hide the rest of the page. Don't wrap every component.

**Safety net 1: before React starts.** If the main JS file fails to download, or `main.tsx` throws before rendering, no boundary exists yet. So `index.html` contains a static message inside the root element, which React replaces as soon as it mounts:
```html
<div id="root">
  <p>Loading Salary Management… If this page doesn't appear, please refresh.</p>
</div>
<noscript>This app needs JavaScript enabled.</noscript>
```

**Safety net 2: errors outside rendering.** Errors in event handlers and async code never reach a boundary. They don't blank the page, but the user would get no feedback. `hooks/use_global_error_listener.ts` (used once, inside the providers) listens to `window` `error` and `unhandledrejection`:
- logs the error with `console.error` (no personal data)
- shows ONE generic notification ("Something went wrong. Please try again.", from constants), at most once every few seconds so repeated errors don't flood the screen
- ignores chunk-load errors (the stale-deploy handling below covers them) and known harmless browser noise (e.g. "ResizeObserver loop" messages)
- is a safety net only: expected errors are still handled where they happen (see below)

**What boundaries do NOT handle** (they never catch these, so each has its own rule):
- **API errors** (expected failures): shown by `ui/feedback/error_state.tsx` with retry (query errors) or a notification (mutation errors). **NEVER** set React Query's `throwOnError` globally to push API errors into boundaries.
- **Event handlers and async code:** handled where they happen (mutation `onError`, try/catch).

**Stale deploys: reload the app automatically.** Every push redeploys with new hashed file names. A user who already has the app open is running the old version, and when it asks for an old page file that no longer exists, the download fails. **The app then reloads itself**, which loads the new `index.html` and the new files.
- **Detect** (two paths, both required):
  - `main.tsx` listens for Vite's `vite:preloadError` event (fired when a lazy file fails to download).
  - The route boundary's `onError` checks `utils/is_chunk_load_error.ts` ("Failed to fetch dynamically imported module", "Importing a module script failed", `ChunkLoadError`).
- **Reload:** both paths call ONE helper, `utils/reload_for_new_version.ts`, which runs `window.location.reload()`. **NEVER** call `reload()` for this anywhere else.
- **Loop guard:** the helper stores the time of the reload in `sessionStorage`. If it already reloaded for this reason within the last `NEW_VERSION_RELOAD_GUARD_MS` (a constant, e.g. 10 seconds), it does **not** reload again. The route fallback shows **"A new version is available"** with a **Reload** button instead. That way a real outage (the file still missing after reloading) never causes an endless reload loop.
- **Why reloading is safe here:** the failure happens when the user navigates to a page they haven't opened yet, so they've just left their previous page and rarely lose unsaved input.
- **Needs the server rules** in "Serving the frontend": `index.html` with `no-cache` (so the reload fetches the new version) and a real 404 for missing assets (so the failure is detectable).
- The global error listener ignores these errors, since the reload handles them.

**Fallback UI:**
- `error_fallback.tsx` is a logic-free UI component (props: title, message, action label, `onAction`), built from Mantine components. Messages come from constants.
- **NEVER** show stack traces, error messages, or technical details to the user. A generic, friendly message only.
- Log the error once in the boundary's `onError` with `console.error` (allowed by ESLint), following the privacy rule: no personal data. No external error-tracking service (out of scope).

**Tests:** a component that throws renders the fallback; "Try again" renders the page again once the error is gone; a chunk-load error triggers one automatic reload, and a second one within the guard window shows the "new version" message instead; a throwing provider renders the root fallback; an unhandled promise rejection shows exactly one notification.

### Routing and code splitting
- Every route page is lazy-loaded with `React.lazy` and rendered through `routes/route_boundary.tsx` (error boundary + `Suspense` with `ui/skeletons/page_skeleton.tsx` as the fallback, not a full-screen loader). **NEVER** import a page statically or render one without the route boundary.
- Route paths and path builders live in `routes/route_paths.ts`. **NEVER** hardcode a path string in a component.
- Vendor code is split into separate chunks (see the Vite config below).

### Performance (memoisation)
Apply memoisation throughout the project, deliberately, following these rules:
- `useCallback` for every function passed as a prop to a child component or used in a hook's dependency array.
- `useMemo` for derived data (filtered, sorted, or mapped lists; table columns; chart data) and for any object or array passed as a prop.
- `React.memo` for components that re-render often with the same props: table rows, list items, cards, form fields.
- Don't wrap trivial values (a constant string, a primitive computed in one line); that adds cost and noise without benefit.
- Search inputs are debounced (shared `use_debounced_value.ts` hook) before they trigger a query.
- Import icons and libraries by name (`import { IconCopy } from '@tabler/icons-react'`). **NEVER** `import * as Icons` or anything else that pulls a whole package into the bundle.

### Tooling

`package.json` scripts:
```json
"dev":     "vite",
"build":   "tsc -b && vite build",
"lint":       "eslint . --fix",
"lint:style": "stylelint \"src/**/*.scss\" --allow-empty-input --fix",
"tsc":        "tsc -b --noEmit",
"test":       "vitest run",
"check":      "npm run lint && npm run lint:style && npm run tsc && npm run test"
```
Styling dependencies: `sass-embedded` (dev; Vite compiles SCSS with it and resolves the `@src` alias in `@use`), `classnames`, and for linting `stylelint`, `stylelint-config-standard-scss`, `stylelint-declaration-strict-value`.

`stylelint.config.js` enforces the styling rules:
```js
export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    // Spacing, fonts and colours must come from tokens, never raw values
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'background', 'fill', 'stroke', '/^margin/', '/^padding/', '/gap$/',
       'top', 'right', 'bottom', 'left', 'inset', 'font-size', 'font-weight', 'font-family', 'line-height'],
      { ignoreValues: ['0', 'auto', 'none', 'inherit', 'transparent', 'currentColor'], expandShorthand: true },
    ],
    'max-nesting-depth':        3,
    'selector-max-id':          0,
    'declaration-no-important': true,
    'selector-class-pattern':   '^[a-z][a-zA-Z0-9]*$', // camelCase
    'at-rule-disallowed-list':  ['import'],              // @use only
  },
}
```
At setup, check that the strict-value plugin accepts namespaced Sass variables (`spacing.$md`); if it doesn't, configure its `ignoreVariables`/`ignoreFunctions` options accordingly.
Deployment happens through Render auto-deploy on every push to `master`, not from an npm script.

ESLint (flat config, ESLint 9) uses `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, and `@stylistic/eslint-plugin` (ESLint's own formatting rules are deprecated and moved to `@stylistic`):

```js
rules: {
  // ── TypeScript ────────────────────────────────────────────────
  '@typescript-eslint/no-unused-vars':      ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-use-before-define': ['error'],
  '@typescript-eslint/no-explicit-any':     'error',
  // Enforce explicit types (useState<T> generics have no lint rule; code review covers them)
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/typedef': ['error', { variableDeclaration: true, arrowParameter: true, parameter: true }],
  'no-unused-vars':                         'off',
  'no-use-before-define':                   'off',

  // ── Imports ───────────────────────────────────────────────────
  'import/no-unresolved':             'off',
  'import/no-named-as-default-member': 'off',
  'import/no-relative-parent-imports': 'off', // handled by no-restricted-imports below
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group:   ['../*'],
          message: 'Relative parent imports (../) are not allowed. Use the @src/* path alias instead.',
        },
      ],
    },
  ],
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'sibling', 'unknown'],
      pathGroups: [
        {
          pattern:  '{react,react/**,react-dom,react-dom/**,react-router,react-router/**,react-router-dom}',
          group:    'external',
          position: 'before',
        },
        { pattern: '@src/**', group: 'internal' },
        { pattern: '**/*.{css,scss}', group: 'unknown', position: 'after' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      'newlines-between':            'always',
      alphabetize:                   { order: 'asc', caseInsensitive: true },
    },
  ],

  // ── React ─────────────────────────────────────────────────────
  'react/jsx-boolean-value': ['error', 'never'],
  'react/jsx-sort-props': [
    'error',
    {
      ignoreCase:           true,
      callbacksLast:        true,
      shorthandFirst:       true,
      shorthandLast:        false,
      reservedFirst:        true,
      noSortAlphabetically: false,
    },
  ],
  'react/require-default-props': 'off',
  'react-hooks/rules-of-hooks':  'error',
  'react-hooks/exhaustive-deps': 'warn',

  // ── General ───────────────────────────────────────────────────
  'arrow-body-style':      'off',
  'no-param-reassign':     ['error', { props: false }],
  'prefer-destructuring':  ['error', { array: false }],
  'no-restricted-exports': 'off',
  'no-console':            ['warn', { allow: ['error'] }],

  // ── Formatting (@stylistic) ───────────────────────────────────
  '@stylistic/indent':               ['error', 2],
  '@stylistic/key-spacing':          ['error', { align: 'value' }],
  '@stylistic/object-curly-newline': ['error', { consistent: true }],
  '@stylistic/operator-linebreak':   ['error', 'before', { overrides: { '=': 'after' } }],
  '@stylistic/quote-props':          ['error', 'consistent-as-needed'],
  '@stylistic/linebreak-style':      ['error', 'unix'],
}
```

`vite.config.ts`:
```ts
resolve: {
  alias: {
    '@src': path.resolve(import.meta.dirname, './src'),
  },
},
build: {
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[hash].[ext]',
      chunkFileNames: 'assets/[hash].js',
      entryFileNames: 'assets/[hash].js',
      manualChunks(id: string): string | undefined {
        if (!id.includes('node_modules')) return undefined
        if (id.includes('@tabler/icons-react')) return 'vendor-icons'
        if (id.includes('@mantine')) return 'vendor-mantine'
        if (id.includes('@tanstack')) return 'vendor-query'
        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
        return undefined
      },
    },
  },
},
```
- The order of the `manualChunks` checks matters: `@tabler/icons-react` and `@tanstack/react-query` contain "react", so they must be checked before the generic react check.
- `tsconfig.json` `paths` must match the alias: `"@src/*": ["./src/*"]`. Use only `@src`, never a second alias, so there is one way to import.
- If the installed Vite version uses Rolldown (Vite 8+), use its equivalent chunking option; check the Vite docs at setup time.

### Testing
- Vitest + React Testing Library for the important flows (employee table renders and paginates, form validation, insights display) and for pure utils (`case_converter`, `format_currency`).
- Mock at the network edge (mock the API module or use MSW), never React Query internals.
- Query by role and label text, as a user would, not by CSS classes.
