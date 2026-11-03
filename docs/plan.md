# Implementation plan

The build order as small, test-first steps. One step per prompt; every commit is reviewed before it is made.

## Every step

- **Tests first:** a red `test(...)` commit, then a green `feat(...)` commit, then `refactor(...)` only if there is something to tidy.
- **Done when** (on top of the step's own criteria): `make check` (api) and/or `npm run check` (web) pass, docs are updated if behaviour changed, and the step has an entry in `docs/ai-workflow.md`.
- **Open questions** from `docs/architecture.md` are answered by Akash **before** the step that needs them (marked **Decide first**).

## Order

| Phase | Steps | Why this order |
|---|---|---|
| 1. API | A1–A10 | The contract the UI depends on |
| 2. Web | W1–W8 | Built against a working API |
| 3. Login | L1–L2 | Lowest priority in the requirements; built on a finished app, so it can be cut if time runs short |
| 4. Delivery | D1–D6 | Docker, Render, performance, README, video, submission |

Review checkpoints: after A10 (review `api/`) and after W8 (review `web/`).

---

## Phase 1: API

### A1. Scaffold and health check
- **Goal:** a FastAPI app factory, settings from environment variables, and `ruff`, `mypy --strict`, `pytest` and `make check` working.
- **Tests first:** `GET /api/health` returns `200 { "data": { "status": "ok" } }` after `SELECT 1`.
- **Done when:** `make check` passes on the empty project plus the health test.
- **Commits:** `chore(api): scaffold FastAPI project` → `test(api): add failing test for health check` → `feat(api): add health check`

### A2. Error contract
- **Goal:** every error leaves the API as `{ "error": ... }`, with `details` for validation errors.
- **Tests first:** an unknown `/api/*` route returns a JSON 404; a validation error returns 422 with field `details`; `NotFoundError` → 404 and `ConflictError` → 409; an unexpected exception returns 500 with a generic message and no internals.
- **Done when:** no response anywhere has FastAPI's default `{ "detail": ... }` shape.
- **Commits:** `test(api): add failing tests for error responses` → `feat(api): map all errors to the error shape`

### A3. Database and employee model
- **Goal:** engine and session dependency, SQLite pragmas, the `employees` table and its indexes, and the first Alembic migration.
- **Tests first:** `foreign_keys` and WAL are on for every connection; a duplicate email is rejected by the database; `created_at` and `updated_at` are set in IST; `updated_at` changes on update.
- **Done when:** `alembic upgrade head` creates the table and every index listed in `docs/architecture.md`.
- **Commits:** `test(employees): add failing tests for employee model` → `feat(employees): add employee model and migration`

### A4. Pagination schemas
- **Goal:** the shared `PaginationRequest` and `PaginatedResponse[T]`.
- **Tests first:** `offset` for page 1 and page 3; `total_pages` is 0 for 0 results and rounds up otherwise; `per_page` above 100 or `page` below 1 is rejected.
- **Done when:** both schemas are generic and used by no feature yet.
- **Commits:** `test(api): add failing tests for pagination schemas` → `feat(api): add pagination request and response`

### A5. Create an employee
- **Goal:** `POST /api/v1/employees` → 201.
- **Tests first:** text fields are trimmed and blank ones rejected; the email is lowercased; the country is uppercased and must be on the allowed list; the salary must be greater than 0 and is a decimal string in the response; a duplicate email returns 409 from the service (also when only the case differs).
- **Done when:** the router calls one service method and returns a resource, never the ORM model.
- **Commits:** `test(employees): add failing tests for creating an employee` → `feat(employees): create an employee` → `refactor(employees): ...` (if needed)

### A6. Get one employee
- **Goal:** `GET /api/v1/employees/{id}`.
- **Tests first:** an existing ID returns 200 with the employee; an unknown ID returns 404 `{ "error": "Employee not found" }`.
- **Done when:** the not-found rule lives in the service, raised as `NotFoundError`.
- **Commits:** `test(employees): add failing tests for getting an employee` → `feat(employees): get an employee by id`

### A7. Update and delete
- **Decide first:** hard or soft delete (open question 7).
- **Goal:** `PATCH /api/v1/employees/{id}` → 200; `DELETE /api/v1/employees/{id}` → 204 with no body.
- **Tests first:** a partial update changes only the sent fields; changing the email to another employee's returns 409; keeping your own email is allowed; update or delete of an unknown ID returns 404; a deleted employee is no longer returned.
- **Done when:** both reuse A5's validation and A6's not-found rule.
- **Commits:** `test(employees): add failing tests for update and delete` → `feat(employees): update and delete employees`

### A8. List: pagination, filters, search, sort
- **Decide first:** fixed lists or free text for job title, department and country (question 3); the sort allow-list (question 4).
- **Goal:** `GET /api/v1/employees` with `page`, `per_page`, `search`, `country`, `job_title`, `department` and `sort`.
- **Tests first:** the default page and size; each filter alone and combined; search matches part of a name or email, ignoring case; `sort=salary` and `sort=-salary`; an unknown sort field returns 422; 0 results return `data: []` and `total_pages: 0`; a page past the end returns 200 with empty `data` and the real `meta`.
- **Done when:** the repository returns `(items, total_count)` and the service builds the response only with `PaginatedResponse.create`.
- **Commits:** one red/green pair each for pagination, filters, search and sort, e.g. `test(employees): add failing test for country filter` → `feat(employees): filter employees by country`

### A9. Salary insights
- **Decide first:** endpoint paths and response shapes (question 2).
- **Goal:** insights by country, by job title within a country, by department, and the org overview.
- **Tests first** (small, hand-built data with known answers):
  - by country: headcount, min, max, average and median, for both odd and even counts
  - by job title: only the chosen country's employees count
  - by department: headcount and average
  - overview: headcount, total payroll and payroll by country
  - an empty database returns empty lists and zeros, not errors
  - responses are arrays of objects, never data values used as keys
- **Done when:** every aggregate runs in SQL `GROUP BY`, except the median, which is computed in Python from one column.
- **Commits:** one red/green pair per insight, e.g. `test(insights): add failing test for salary by country` → `feat(insights): add salary insights by country`

### A10. Seed 10,000 employees
- **Decide first:** the countries, departments, job titles and salary ranges (question 9).
- **Goal:** a seed script that bulk-inserts 10,000 employees, with a fixed random seed.
- **Tests first:** seeding the same small number twice gives identical data; emails are unique; every value passes the same validation as the API; seeding is skipped when employees already exist.
- **Done when:** the full seed runs in under 30 seconds and its time is noted for `docs/performance.md`.
- **Commits:** `test(seed): add failing tests for seed script` → `feat(seed): seed 10,000 employees`

**Checkpoint:** review all of `api/` against `CLAUDE.md` and `docs/requirements.md`, and fix the findings one commit at a time.

---

## Phase 2: Web

### W1. Scaffold
- **Goal:** Vite, React, TypeScript and Mantine, with the `@src` alias, ESLint, Stylelint, Vitest, `npm run check`, the theme, the env config and the vendor chunks.
- **Tests first:** one smoke test that the app renders.
- **Done when:** `npm run check` and `npm run build` pass.
- **Commits:** `chore(web): scaffold React project` → `chore(web): add lint, type check and test tooling`

### W2. API client and case conversion
- **Goal:** one axios instance whose interceptors convert keys both ways and turn every failure into an `IApiError`.
- **Tests first:**
  - nested objects and arrays convert in both directions, and values never change
  - `FormData`, `Blob` and `Date` are skipped
  - query params are converted
  - a 422 `details[].field` becomes camelCase
  - a network error gives the fallback message
- **Done when:** no other file imports axios.
- **Commits:** `test(web): add failing tests for case converter` → `feat(web): add case converter` → `test(web): add failing tests for api client errors` → `feat(web): add api client with interceptors`

### W3. Routing and error handling
- **Goal:**
  - lazy routes behind the route boundary, with the app shell and the skeleton fallback
  - the root, app and route error boundaries
  - the stale-deploy reload with its loop guard
  - the global error listener
  - the static message in `index.html`
- **Tests first:**
  - a throwing page shows the fallback, and "Try again" recovers once the error is gone
  - a chunk-load error reloads once; a second one within the guard window shows "A new version is available"
  - a throwing provider shows the root fallback
  - an unhandled rejection shows exactly one notification
- **Done when:** no route renders without the boundary, and no path string is hardcoded outside `route_paths.ts`.
- **Commits:** a red/green pair each for the route boundary, the reload helper and the global listener

### W4. Employee list
- **Goal:** the table with pagination, a skeleton while loading, and empty and error states.
- **Tests first:** rows render from a mocked API; moving to the next page requests page 2 and keeps the current rows visible meanwhile; an error shows the retry state; no results show the empty state.
- **Done when:** salaries are formatted as USD and never parsed as numbers.
- **Commits:** `test(web/employees): add failing test for employee table` → `feat(web/employees): show paginated employee list`

### W5. Search, filters and sort
- **Goal:** search, country, job title and department filters, and sorting, all kept in the URL.
- **Tests first:** URL state reads and writes; changing a filter or search resets to page 1; search is debounced; refreshing keeps the view; an empty page past the end steps back to the last page.
- **Done when:** the list state lives only in `use_list_url_state`.
- **Commits:** a red/green pair each for URL state, search, filters and sort

### W6. Create and edit
- **Decide first:** routes or modals, and whether "view" needs its own page (question 1).
- **Goal:** one shared employee form for create and edit.
- **Tests first:** client validation messages; a server 409 or 422 is shown on the matching input; the submit button is loading and disabled while saving; success shows a notification and refreshes the list.
- **Done when:** the form is in `src/common/employee_form/`, and all messages come from constants.
- **Commits:** `test(web/employees): add failing tests for employee form` → `feat(web/employees): create and edit employees`

### W7. Delete
- **Goal:** delete with a confirmation modal naming the employee.
- **Tests first:** cancelling deletes nothing; confirming shows the loading button, then a success notification; a failure shows the API's message.
- **Done when:** the list refreshes and steps back a page when the last row on a page is deleted.
- **Commits:** `test(web/employees): add failing tests for delete` → `feat(web/employees): delete an employee with confirmation`

### W8. Salary insights page
- **Goal:** tables and stat cards for every insight, with a country picker for job titles.
- **Tests first:** each insight renders from a mocked API; card skeletons while loading; an error state per section.
- **Done when:** the page does no arithmetic, only formatting.
- **Commits:** `test(web/insights): add failing tests for insights page` → `feat(web/insights): show salary insights`

**Checkpoint:** review all of `web/` against `CLAUDE.md` and `docs/requirements.md`, and fix the findings one commit at a time.

---

## Phase 3: Login

### L1. Login API
- **Decide first:** where the login rate limit is stored (question 8).
- **Goal:** the `users` and `sessions` tables, Argon2 passwords, login, logout and current-user endpoints, router-level protection, the origin check and the rate limit. The seed creates the HR manager from environment variables.
- **Tests first:**
  - login sets an `HttpOnly`, `SameSite=Lax` cookie, plus `Secure` when enabled
  - a wrong email and a wrong password return the same 401
  - no cookie or an expired session returns 401 on a protected route
  - logout invalidates the session
  - a write from a foreign origin returns 403
  - the sixth failed login returns 429
- **Done when:** every employee and insights route requires a session, and only login is public.
- **Commits:** a red/green pair each for passwords, login, protection, logout, the origin check and the rate limit

### L2. Login page
- **Goal:** the login page, the protected route with the full-screen loader, the 401 redirect and logout.
- **Tests first:** an unauthenticated visit redirects to login and returns to the wanted page afterwards; the login error is the API's generic message; logout clears the cache and returns to login.
- **Done when:** nothing about the session is readable from JavaScript.
- **Commits:** `test(web/auth): add failing tests for login` → `feat(web/auth): add login and protected routes`

---

## Phase 4: Delivery

### D1. Serve the frontend and package with Docker
- **Goal:** FastAPI serves the React build; a multi-stage Dockerfile; startup runs migrate → seed if empty → serve; `docker compose up` runs it locally.
- **Tests first:** `/assets/*` has the one-year immutable cache header; a missing asset returns 404, not `index.html`; any other path returns `index.html` with `no-cache`; an unknown `/api/*` path still returns the JSON 404.
- **Done when:** a fresh `docker compose up` shows the seeded app at one URL.
- **Commits:** `test(api): add failing tests for frontend serving` → `feat(api): serve the React build` → `chore: add Dockerfile and compose file`

### D2. Deploy to Render
- **Goal:** a Render free web service from `master`, with the health check at `/api/health` and auto-deploy on push.
- **Done when:** the live URL passes a manual smoke test of every in-scope feature.
- **Commits:** `docs: add deployment notes` (if any setup needs recording)

### D3. Performance
- **Goal:** `docs/performance.md` with measured numbers on the 10,000-employee seed: seed time, list and insights response times, `EXPLAIN QUERY PLAN`, bundle sizes, and optimisations applied and skipped.
- **Done when:** every target in `docs/requirements.md` has a measured number next to it, and open questions 5 and 6 are answered with data.
- **Commits:** `docs: add performance measurements` (plus a `perf(...)` pair if a target is missed)

### D4. README
- **Goal:** the live URL (with the "first load after idle takes about a minute" note), how to run, how to test, demo login, screenshots, and links to every doc.
- **Done when:** every link and command works from a fresh clone.
- **Commits:** `docs: add README`

### D5. Video demo
- **Goal:** a 3–5 minute recording: problem, demo, architecture, tests, AI workflow. The link goes in the README.
- **Commits:** `docs: add video link to README`

### D6. Submit
- **Goal:** check the commit history, run a fresh clone with both checks and the app, confirm the README links and that the docs match the code. Then reply to the assessment email with the repo link.
- **Done when:** everything passes, and the live URL was opened a minute before sending, so it's awake.
