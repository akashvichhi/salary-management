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

## 16. Soft delete

- **Context:** deleting an employee removes salary history the HR manager may still need, and a mistaken delete can't be undone.
- **Options:** hard delete; soft delete with an `is_active` flag; soft delete with a `deleted_at` timestamp.
- **Decision:** an `is_active` flag. Every repository query starts from `active_employees()`, so a deleted employee can't leak into a list, a lookup or (later) the insights. Email is unique only among active employees (a partial unique index), so a deleted employee's email can be used again.
- **Consequences:** rows are never removed, so the table only grows (fine at 10,000 rows). There is no restore endpoint yet; it would be one `UPDATE`. A `deleted_at` column would add when, which nobody asked for.

## 17. Fixed lists for country, department and job title

- **Context:** filters and insights group by these fields; free text would split "Engineer" and "engineer " into two groups.
- **Options:** free text; fixed lists in code; lookup tables in the database.
- **Decision:** fixed lists as `StrEnum`s in `constants/employee_constants.py`. Input is matched ignoring case and spaces and stored in the list's spelling. Filters use the same normalisation.
- **Consequences:** clean groups and simple dropdowns. Adding a value is a code change and a deploy, not a form; lookup tables would only pay off if HR needed to edit the lists themselves.

## 18. Seed data: title ranges scaled by country

- **Context:** the insights are only worth showing if the seed data has real patterns; the seed must also be identical on every run and fast.
- **Options:** one salary range for everyone; one range per job title; a range per job title scaled by a per-country pay factor. Names from the Faker library, or from our own name lists.
- **Decision:** each job title has a USD range, a department and a weight (how common it is); each country has a pay factor (US 1.00, India 0.30, ...) and a weight. Names come from `scripts/data/*.txt`. All of it is in `scripts/seed_constants.py`, drawn with a fixed `random.Random(42)`, and fixed hire-date bounds instead of today's date. Every employee is built through `EmployeeCreateRequest`, then bulk-inserted in one statement. The seed is skipped when the table already has rows.
- **Consequences:** country and job-title insights differ in believable ways. No Faker, whose output can change between versions and break "identical on every run". Emails use the reserved `example.com` domain, so no real inbox is ever named. 10,000 employees seed in about 1.5 seconds.

## 19. One endpoint per insight; money rounded half-up to the cent

- **Context:** the insights page shows four independent sections, and the job-title section changes with a country picker.
- **Options:** one combined endpoint returning every section; one endpoint per insight.
- **Decision:** four `GET` endpoints under `/salary-insights` (`overview`, `by-country`, `by-job-title?country=`, `by-department`), each `{ "data": ... }` with arrays of objects sorted by their group. Headcount, min, max and sum come from SQL `GROUP BY`; the sum adds whole cents as integers (SQLite keeps `NUMERIC` as floats, and a float sum of 10,000 large salaries can lose a cent), and the average is that exact sum divided by the headcount, not SQLite's `AVG` (a float); the median is computed in Python (decision 5). Averages and medians are rounded **half-up** to the cent (`100000.005` → `100000.01`).
- **Consequences:** each section loads, caches and fails on its own, and changing the job-title country reloads only that table. Four requests instead of one, which is cheap on the same origin. On the 10,000 seed every endpoint answers in under 61 ms; `by-country` is the slowest because it reads one salary column for the median.

## 20. Frontend tool versions held back for plugin support

- **Context:** at setup (W1) the newest majors were ESLint 10, TypeScript 7 (the native port) and Stylelint 18, but the plugins `CLAUDE.md` requires don't support them yet: `eslint-plugin-react` and `eslint-plugin-import` stop at ESLint 9, `typescript-eslint` needs TypeScript below 6.1, and `stylelint-declaration-strict-value` stops at Stylelint 17.
- **Options:** the newest majors with `--legacy-peer-deps`; drop the plugins; the newest versions every plugin supports.
- **Decision:** ESLint 9.39.5, TypeScript 6.0.3 and Stylelint 17.16.0; everything else at its newest version. Vite 8 bundles with Rolldown, so the vendor chunks use `codeSplitting.groups` instead of Rollup's `manualChunks`.
- **Consequences:** every rule in `CLAUDE.md` works, with no forced installs. Upgrade once each plugin's peer range allows it.

## 21. Dropdown lists served by the API

- **Context:** the filters, the employee form, the table's country names and the URL check need the country, department and job title lists (10, 10 and 20 values), which are fixed in `api/app/constants/employee_constants.py` (decision 17).
- **Options:** copy them into `web/src/constants/employee_constants.ts`; serve them from a new `GET /api/v1/employee-options` endpoint.
- **Decision:** serve them from the endpoint, so the backend is the one source of truth. The country display names moved to the backend too (`COUNTRY_NAMES`). This replaces the first choice, a copy in the web app, which was built in W5 and dropped in W7.1 at review: two copies are two places to change, and they can drift.
- **Consequences:** adding a value is a backend change only. The list page waits for this one small request before asking for employees, since the URL check needs the lists; it is cached for the whole visit (`staleTime: Infinity`) because the lists only change with a deploy, which reloads the app. If it fails, the page shows an error with a retry.

## 22. Add and edit in modals on the list page

- **Context:** the HR manager adds and edits employees while working through the list, often with a search or filter applied. An employee has seven fields, all of which the table already shows.
- **Options:** separate routes (`/employees/new`, `/employees/:id/edit`) with a shared form, plus a detail page for "view"; or modals on the list page, with the table row as the view.
- **Decision:** modals on the list page, one form for both add and edit, and no detail page.
- **Consequences:** the list keeps its URL state (page, filters, sort) and scroll position while editing, and no extra routes, lazy chunks or form skeleton are needed: the edit form is filled from the row, so it never waits on a request. An edit can't be shared as a link, which the requirements don't ask for. Edit sends only the fields that changed (`PATCH`). The form is used by one page only, so it lives in `pages/employee_list/`, not `common/`.

## 23. Login rate limit in memory

- **Context:** failed logins are limited to 5 per email and IP in 15 minutes (decision 10), and the counts have to live somewhere (open question 8).
- **Options:** a dictionary in the app's memory; a `login_attempts` table in SQLite.
- **Decision:** in memory (`core/login_rate_limiter.py`), one limiter per app, with a lock because `def` endpoints run in a thread pool. The window slides: each failure counts for 15 minutes. A successful login clears the count.
- **Consequences:** no table, migration or cleanup job. The counts are lost on restart and aren't shared between processes, which is fine for one container with one worker; more workers or instances would need the table (or Redis) instead. Behind Render's proxy (with `TRUST_FORWARDED_FOR=true`) the IP is the **last** `X-Forwarded-For` entry (`api/client_ip.py`), the one the proxy appended. The earlier entries are written by the client, so using the first (as uvicorn's `--proxy-headers` does) would let a forged header give every attempt a fresh key and skip the limit. Without that setting the header is ignored and the socket's IP is used, since anywhere else the caller writes the whole header. Each attempt is counted before its password is checked, in one locked step, so parallel guesses can't all pass the check before any is counted; a success clears the count. Keys untouched for a window are swept once per window.

## 24. Demo login prefilled from build variables

- **Context:** reviewers open the deployed demo and shouldn't have to look up the login (the user's request).
- **Options:** show the credentials as text on the login page; prefill the form from `VITE_DEMO_LOGIN_*` build variables; a "demo" button that skips the form.
- **Decision:** prefill from build variables, read in `config/env.ts`. Without them the form starts empty, as before.
- **Consequences:** Vite builds the values into the JavaScript, so anyone who opens the app can read them. They must only ever be a demo account, never a real one. The real login rules (Argon2, the generic error, the rate limit) still apply.

## Runtime dependencies

Each runtime dependency gets one line here, with its reason, when it is added.

| Package | Reason |
|---|---|
| `fastapi` | The web framework (decision 1) |
| `uvicorn` | The server that runs the FastAPI app |
| `pydantic-settings` | Reads environment variables into one typed `Settings` class (`core/config.py`) |
| `sqlalchemy` | The ORM and database access layer for SQLite (decisions 2 and 14) |
| `alembic` | Versioned schema migrations, run on startup instead of `create_all()` (decision 2) |
| `argon2-cffi` | Argon2 password hashing for the HR manager's login; a safe password hash is not something to write ourselves |
| `email-validator` | Checks email syntax for Pydantic's `EmailStr`; correct email parsing is far longer than a few lines of our own |
| `react`, `react-dom` | The UI library; Mantine and React Query are built for it |
| `@mantine/core`, `@mantine/hooks` | The component library and its hooks (decisions 3 and 12) |
| `axios` | One HTTP client with interceptors, so case conversion and error normalisation happen in one place |
| `react-router` | URL-based routing with lazy pages, so refresh, the back button and shared links keep the view |
| `react-error-boundary` | Error boundaries as components with reset support, so we write no class components (decision 13) |
| `@tanstack/react-query` | Server-state cache: loading and error states, keeping the previous page while the next loads, and invalidation after edits |
| `@mantine/notifications` | Toasts in the same design system, for mutation feedback and the global error listener |
| `@mantine/form` | Form state, validation and per-field errors (including the API's `details`) in the same design system |
| `@mantine/modals` | The delete confirmation, opened from a hook without placing a modal in every page |
| `@mantine/dates` | The hire date picker (`DatePickerInput`), matching the other Mantine inputs; it returns the `YYYY-MM-DD` string the API takes |
| `dayjs` | Required peer of `@mantine/dates`, which formats and parses dates with it |
| `@tabler/icons-react` | The icon set Mantine's docs use; icons are imported by name, so only the ones used reach the bundle |
