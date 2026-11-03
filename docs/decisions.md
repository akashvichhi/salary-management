# Design decisions

Short architecture decision records. Each one says what was decided and what it costs.

## 1. FastAPI over Django

- **Context:** the role is Python. The UI is a separate React app, so the backend only serves a JSON API.
- **Options:** Django with Django REST Framework; FastAPI.
- **Decision:** FastAPI, with SQLAlchemy 2, Pydantic v2 and Alembic.
- **Consequences:** Pydantic schemas give validation and OpenAPI docs for free. FastAPI has no fixed project layout, so the router → service → repository layers are our own and visible in the code. There is no built-in admin or auth, so login is built by hand.

## 2. SQLite

- **Context:** 10,000 employees, one HR manager, and a brief that suggests SQLite.
- **Options:** SQLite; PostgreSQL.
- **Decision:** SQLite through SQLAlchemy, with `foreign_keys = ON` and WAL mode on every connection, and Alembic for schema changes.
- **Consequences:** no database server to run or pay for; the file ships inside the container. One writer at a time is fine for one user. SQLite has no median function (see 5), and the file is lost on restart on Render (see 8). Moving to PostgreSQL means a new connection URL and re-running the migrations.

## 3. Mantine

- **Context:** the brief allows any component library. The app needs tables, forms, modals, notifications and skeletons.
- **Options:** Ant Design (suggested by the AI); Mantine.
- **Decision:** Mantine, with `@mantine/form`, `@mantine/notifications` and `@mantine/modals`.
- **Consequences:** layout components (`Group`, `Stack`, `SimpleGrid`) cover most styling, which is what makes decision 12 possible.

## 4. Currency: USD only

- **Context:** employees are in several countries. Incubyte had not answered the currency question (`docs/clarifications.md`).
- **Options:** local currency per employee; local currency plus fixed-rate USD for comparisons; USD only.
- **Decision:** every salary is annual base pay in USD. No currency column, exchange rates or conversion.
- **Consequences:** every figure can be compared, sorted and totalled across countries directly. Real multi-country payroll runs in local currencies; supporting them later needs a currency column, a rates table and conversion in the insights.

## 5. Aggregation in SQL, median in Python

- **Context:** insights summarise up to 10,000 salaries. SQLite has no median function.
- **Options:** load all rows into Python; aggregate in SQL.
- **Decision:** count, min, max, average and totals run in SQL with `GROUP BY`. Median is computed in Python on the filtered salary column only.
- **Consequences:** the common aggregates never load rows into Python. The median still reads the salary column for the rows in scope; its cost is measured in `docs/performance.md`. PostgreSQL would allow `percentile_cont` instead.

## 6. snake_case API, converted once in the axios interceptors

- **Context:** Python uses snake_case and TypeScript uses camelCase.
- **Options:** a camelCase API through Pydantic aliases; snake_case in the frontend; convert in one place in the client.
- **Decision:** the API is snake_case. Axios interceptors in `api_client.ts` convert keys both ways. Values are never converted, except `details[].field` in 422 errors so it matches the form field.
- **Consequences:** both sides stay idiomatic, and no API function converts anything. This only works because the API never uses data values as JSON keys. Values the API expects in snake_case (e.g. `hire_date` as a sort field) are constants in that form.

## 7. Server-side pagination

- **Context:** 10,000 employees are too many to send to the browser at once.
- **Options:** send everything and page in the browser; offset pagination on the server; keyset pagination.
- **Decision:** offset pagination with `page` and `per_page` (default 20, max 100). One shared `PaginationRequest` / `PaginatedResponse[T]` pair, mirrored by `IPaginationParams` / `IPaginatedResponse<T>`.
- **Consequences:** small responses, and filters and sorting run in SQL. Each page also runs a `COUNT`. Keyset pagination is skipped: deep offsets are cheap at 10,000 rows.

## 8. One container on Render's free tier

- **Context:** the brief requires deployed software, and hosting should cost nothing.
- **Options:** local only (misses the requirement); Hugging Face Spaces, Koyeb, Fly.io or Railway (paid plan, card or trial credit only, as checked in Oct 2026); Render's free web service.
- **Decision:** one Docker image on Render. FastAPI serves the React build and the API; SQLite lives inside the container. Startup migrates, then seeds if the database is empty.
- **Consequences:** the service sleeps after 15 minutes idle, so the first load takes about a minute. There is no persistent disk, so every restart reseeds and live edits are lost. Frontend and API share one origin, so production needs no CORS.

## 9. No CI; local checks are the gate

- **Context:** Render deploys every push to `master` automatically.
- **Options:** GitHub Actions running the checks; local checks only.
- **Decision:** no CI pipeline. `make check` (api) and `npm run check` (web) must pass before every push.
- **Consequences:** less setup, but nothing stops a push that skipped the checks, and that push deploys. It relies on discipline. CI is the first thing to add with a second developer.

## 10. Session cookies over JWT

- **Context:** login is in scope for one HR manager (`docs/requirements.md`).
- **Options:** a JWT in `localStorage`; a JWT in a cookie; a server-side session in an httpOnly cookie.
- **Decision:** server-side sessions. The cookie is `HttpOnly; Secure; SameSite=Lax` and holds a random ID; the database stores only its SHA-256 hash. Argon2 passwords, an origin check against CSRF, and a limit of 5 failed logins per 15 minutes.
- **Consequences:** JavaScript can never read the session, and logout takes effect immediately. Each request costs one session lookup. A production system would use the company's SSO (OIDC) instead.

## 11. Tables before charts

- **Context:** the HR manager needs exact answers about pay.
- **Options:** charts; tables and stat cards.
- **Decision:** tables and stat cards. Charts are left out (`docs/requirements.md`).
- **Consequences:** exact numbers, accessible by default, and less code. Less visual at a glance; `@mantine/charts` could be added later without changing the API.

## 12. Mantine components first; custom SCSS only when needed

- **Context:** consistent spacing and look, with as little custom CSS as possible.
- **Options:** custom CSS for layout; Mantine components and props.
- **Decision:** Mantine components first, with theme keys only (`gap="md"`, never `gap={10}`). Then Mantine's `classNames`, then an SCSS module using design tokens. Inline styles only for runtime values.
- **Consequences:** most screens need no SCSS at all. Token files and SCSS modules are created only when first needed. Stylelint rejects hardcoded values.

## 13. Error handling: boundaries and stale-deploy reloads

- **Context:** a rendering bug must never leave a blank screen. Every push redeploys with new file names, so an open tab can request files that no longer exist.
- **Options:** one app-wide boundary; boundaries at several levels.
- **Decision:** `react-error-boundary` at three levels (root, app, route), a static message in `index.html`, and a global listener for errors outside rendering. API errors stay in error states and notifications, never boundaries. A failed chunk download reloads the app once; a second failure within a few seconds shows "A new version is available".
- **Consequences:** the server must send `index.html` with `no-cache` and a real 404 for missing assets. A reload can lose unsaved input, but it only happens when navigating to a page not yet opened.

## 14. Plain `def` endpoints with synchronous SQLAlchemy and SQLite

- **Context:** SQLAlchemy with SQLite is synchronous.
- **Options:** `async def` calling the synchronous database, which blocks the event loop; async SQLAlchemy; plain `def`.
- **Decision:** plain `def` endpoints. `async def` only for code that awaits truly async I/O.
- **Consequences:** FastAPI runs these endpoints in a thread pool, so a blocking database call never freezes the event loop for other requests. Simpler than an async database stack, which would gain nothing with one user and SQLite's single writer.

## 15. IST everywhere

- **Context:** the HR manager works in India and asked for IST as the app's time zone.
- **Options:** store UTC and show IST in the UI; store UTC and send IST from the API; IST everywhere.
- **Decision:** IST (Asia/Kolkata, UTC+05:30) for storage, the API (`+05:30` offset) and the UI, from one constant per app. It is a fixed offset, because Asia/Kolkata has no daylight saving, so no `tzdata` package is needed.
- **Consequences:** the database, API and screen show the same times, with no conversion. Supporting users in other zones later means converting stored times, or adding a per-user zone in the UI.

## Runtime dependencies

Each runtime dependency gets one line here, with its reason, when it is added.

| Package | Reason |
|---|---|
| `fastapi` | The web framework (decision 1) |
| `uvicorn` | The server that runs the FastAPI app |
| `pydantic-settings` | Reads environment variables into one typed `Settings` class (`core/config.py`) |
| `sqlalchemy` | The ORM and database access layer for SQLite (decisions 2 and 14) |
| `alembic` | Versioned schema migrations, run on startup instead of `create_all()` (decision 2) |
| `email-validator` | Checks email syntax for Pydantic's `EmailStr`; correct email parsing is far longer than a few lines of our own |
