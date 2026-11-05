# Prompts and AI workflow

## Tools

- **Claude Code** (CLI) for planning, writing docs and writing code.
- **`CLAUDE.md`** steers it. It is the rules file every session reads first: design principles, folder structure, naming, the API contract, testing, and the commit workflow. When the AI gets something wrong, I fix the rule there, so the fix applies to every later prompt and not just one answer.

## How I work with AI

- **Plan before code.** Clarifying questions, requirements, architecture and decisions were written and reviewed before any code.
- **A rules file**, not repeated instructions (`CLAUDE.md`).
- **One focused prompt per step.** Never "build the app"; each prompt does one step and stops.
- **I review every change before it is committed.** The AI shows the files, a summary, the proposed commit message and the check results, then waits for my OK. Approval covers one commit only. Pushing needs its own approval.
- **Test first.** Red, green and refactor commits, each approved separately.
- **AI commits are marked** with a `Co-Authored-By` trailer, so the history shows where AI was used.

---

The log has one entry per step, oldest first, in the format `CLAUDE.md` sets.

## 2026-10-30 to 2026-11-03 — Planning session

- **Prompt / instruction:** I gave the AI the assessment brief and email, and asked it to help plan the stack, hosting, rules and steps before writing any code. Follow-up questions included "do we need charts?", "what are we missing?", "does the backend use the same pagination shape as the frontend?", "camelCase or kebab-case CSS classes?", "how do we stop a JS error leaving a blank page?" and "how do we optimise React and FastAPI?".
- **What the AI produced:**
  - a draft of the clarifying questions
  - a stack proposal (FastAPI, SQLite, React with Ant Design)
  - a hosting comparison from a web search
  - the rules file
  - a step-by-step plan with one prompt per step
- **What I changed, rejected, or corrected, and why:**
  - **Clarifying questions:** I removed "AI in the product" (the brief never asks for it) and the deployment question (the platform is our choice).
  - **Component library:** I chose Mantine over the suggested Ant Design.
  - **Hosting:** I proposed running locally only; I accepted Render's free tier after the AI pointed out that "deployed" is a requirement.
  - **Charts:** I asked whether we need them, and we kept tables first.
  - **CI:** the AI added a GitHub Actions pipeline; I removed it, because Render deploys on push and local checks are the gate.
  - **Committing:** the AI first planned to commit as it went; I changed this to my approval before every commit.
  - **Commit order:** the AI put `.gitignore` alone in the first commit; I put the requirements first, as the brief implies.
  - **Rules I added:**
    - one React Query file per resource, and all query keys in one file
    - a `common/` folder for components shared by 2+ pages
    - `I` and `T` prefixes, and no untyped variables
    - skeletons instead of spinners
    - httpOnly cookies, and the `master` branch
    - Mantine first, then SCSS with tokens and no hardcoded values
    - error boundaries
    - checks run once, when the work is done
  - **AI changes to my examples, kept:**
    - no `deploy` npm script
    - ESLint formatting rules moved to `@stylistic`
    - one import alias, `@src`
    - targeted memoisation instead of wrapping everything
  - **"What are we missing?":** the AI fixed its own contradictions (untyped examples, React 19's `JSX` type, a case-conversion bug in 422 field errors), and I accepted 7 additions:
    - SPA serving and a health check
    - this log
    - no personal data in logs
    - committed lock files
    - input hygiene
    - UX rules
    - enforced coverage
  - **Optimisation:** of 20 ideas, 10 were already covered, I added 6, and 4 are deliberately skipped (recorded as improvements).
  - **3 Nov, notes vs. the sent email:** the AI compared my planning notes with the email I actually sent and found three mismatches: 7 questions were sent, not 6; the timeline question was still in; and the email promised to start on documented defaults, while the plan said to wait for a reply. I corrected the notes and decided to start on documented assumptions.
  - **3 Nov, the brief:** the AI had not opened the assessment link from the email; I pointed it to the document, and it read the brief and confirmed the plan matched.
  - **3 Nov, the answers:** the AI suggested answers to my six questions. I accepted five and changed currency to **USD only**. The AI had first suggested local currency with no conversion, then corrected itself to local currency plus fixed-rate USD.
  - **3 Nov, setup problems the AI flagged:** a coverage threshold that would fail single-file test runs, Windows line endings breaking the LF lint rule, the ignore file missing its leading dot, and `uv` and `make` not installed.
- **How it was verified:** I compared the plan with the brief and with the email as sent, tested GitHub SSH access, and checked the installed tool versions.

## 2026-11-03 — Step 3: git setup

- **Prompt / instruction:** "Run `git init -b master`, add the remote, run `git status` and show me the output. Don't commit anything."
- **What the AI produced:** the repo on `master` with the `origin` remote. It took my GitHub username from the SSH check instead of asking, confirmed the remote repo exists and is empty, and renamed `gitignore` to `.gitignore`.
- **What I changed, rejected, or corrected, and why:** I created a `salary-management` folder for the repo, so the AI moved the repo and project files into it (safe, with no commits yet).
- **How it was verified:** `git status`, `git remote -v` and `git rev-parse --show-toplevel` in the new folder.

## 2026-11-03 — Step 4: clarifications and requirements (`e0456a9`)

- **Prompt / instruction:** write `docs/clarifications.md` (each question, the answer or an "Assumed" answer, and its build impact) and a one-page `docs/requirements.md`; list conflicts with `CLAUDE.md` without editing it.
- **What the AI produced:** both docs (requirements in 430 words), and a list of 8 conflicts with line numbers (currency in examples, the pending-auth rule, a missing department filter, a missing salary index).
- **What I changed, rejected, or corrected, and why:**
  - I removed the timeline question from the clarifications, because it doesn't affect the build; the intro now says "product questions".
  - I kept the AI's own choices: a department filter, measurable performance targets (to be proven later in `docs/performance.md`), and charts left out.
- **How it was verified:** word count for the one-page limit; the requirements checked against the brief; the conflicts found by searching `CLAUDE.md`.

## 2026-11-03 — Step 5: align the rules (`eda0a2c`)

- **Prompt / instruction:** update `CLAUDE.md` to match the requirements and fix every listed conflict; I also asked the AI to update any other files affected by the day's decisions.
- **What the AI produced:**
  - `CLAUDE.md` with USD only, auth in scope and built last, the department filter and the salary index
  - the coverage threshold moved to `make check`
  - the `.gitignore` timing rule
  - a new `.gitattributes` forcing LF line endings
- **What I changed, rejected, or corrected, and why:** after commit 2, I asked for every commit to use my name and Zoho email. The AI rewrote both unpushed commits with the new author and set the identity for this repo only.
- **How it was verified:** a search for leftover currency and pending-auth wording; `git ls-files --eol` showed LF everywhere; after the rewrite, `git diff` between the old and new commits was empty.

## 2026-11-03 — Step 6: architecture and data model (`90d9c6d`)

- **Prompt / instruction:** write `docs/architecture.md`: overview, system diagram, layers with a sequence diagram, data model, API outline, frontend data flow, startup. Only what's in scope; anything undecided goes in "Open questions".
- **What the AI produced:** the document with 4 Mermaid diagrams, the data model with a reason for every index, and 9 open questions (e.g. create and edit as routes or modals, insights endpoint shapes, fixed lists or free text, seed data).
- **What I changed, rejected, or corrected, and why:** accepted as written. The AI flagged the one thing it added beyond the sources (`uvicorn` as the server).
- **How it was verified:** checked against the requirements and `CLAUDE.md`; a word count for the 5-minute reading target. The diagrams are checked once they render on GitHub.

## 2026-11-03 — Step 7: design decisions (`3f0aac2`)

- **Prompt / instruction:** write `docs/decisions.md` as 14 short ADRs (Context / Options / Decision / Consequences), recording only decisions already made.
- **What the AI produced:** 14 ADRs and an empty "Runtime dependencies" section, to be filled as dependencies are added.
- **What I changed, rejected, or corrected, and why:** accepted as written. Before showing it, the AI corrected itself in three places: ADR 13 was missing its Options line, ADR 14 overstated the thread-pool benefit (SQLite still allows only one writer), and ADR 5 was reworded for clarity.
- **How it was verified:** each ADR has exactly four fields (56 = 14 × 4), and each decision traces to the requirements, the clarifications or `CLAUDE.md`.

## 2026-11-03 — Step 8: start this log

- **Prompt / instruction:** create this file: tools, how I work with AI, and one entry per step so far, with the planning session first.
- **What the AI produced:** this file.
- **What I changed, rejected, or corrected, and why:** nothing yet; anything I change in review is added here before the commit.
- **How it was verified:** each entry checked against the commit history (`git log`) and the review of each step.

## 2026-11-03 — Step 9: implementation plan (`e8752e5`)

- **Prompt / instruction:** write `docs/plan.md`: the build order as small, testable steps (API, then web, then delivery), each with its goal, the tests to write first, "done when" and the expected commits. Use only the requirements and the architecture.
- **What the AI produced:** 26 steps in four phases, a checkpoint review after the API and after the web app, and a **Decide first** marker on the seven steps that need an open question answered.
- **What I changed, rejected, or corrected, and why:** accepted as written. The AI flagged two choices for me to check: login as its own phase after the web app, so it can be cut without touching anything else; and test lists for error handling and login taken from the required tests in `CLAUDE.md`, beyond the two source documents.
- **How it was verified:** every in-scope feature in the requirements maps to a step, and every open question in the architecture is assigned to the step that needs it.

## 2026-11-03 — Step 10: first push

- **Prompt / instruction:** "Run `git log --oneline` and `git ls-files` and show me the output, so I can confirm only the intended files are tracked. Then wait for my OK before pushing."
- **What the AI produced:** the log and file list (6 commits, 9 files, no `.env` or database file), the author on every commit, and confirmation that the remote was still empty. After my OK, it pushed `master` to `origin`.
- **What I changed, rejected, or corrected, and why:** nothing. The AI asked me to confirm the author email before the push, because changing it afterwards would mean rewriting published history.
- **How it was verified:** `git ls-remote origin` shows the same commit as local `master`.

## 2026-11-03 — README

- **Prompt / instruction:** "Should we have a README file for the project?", then "please write a file".
- **What the AI produced:** a short README: what the app does, a status note, the stack, and links to every doc. It recommended adding one now, instead of waiting for the delivery step, so the repo has a front page and the `CLAUDE.md` rule "update `README.md` when setup changes" has a file to update.
- **What I changed, rejected, or corrected, and why:** I removed the status note.
- **How it was verified:** every link points to a file that exists in the repo.

## 2026-11-03 — Step A1: scaffold and health check (`87e0eb0`, …)

- **Prompt / instruction:** "Continue with the very first step A1", then "please define the route and make tests passing".
- **What the AI produced:**
  - the scaffold commit: app factory, settings in `core/config.py`, ruff, `mypy --strict`, pytest and `make check`
  - a failing test for `GET /api/health` with an in-memory SQLite test client
  - the health route, mounted outside `/api/v1`, with the `SELECT 1` check in `core/database.py` so the router runs no SQL
  - `create_app(settings)` builds the engine per app, so each test gets its own database
  - the generic `DataResponse[T]` shape, and SQLAlchemy as a pinned dependency
- **What I changed, rejected, or corrected, and why:**
  - I asked why a test was committed before its route. The AI explained the red/green rule in `CLAUDE.md`, and I asked it to write the route.
  - I asked whether `/` needs a route. It doesn't: `/` is reserved for the React build (step D1), so a 404 there is correct until then.
  - I ran the tests myself and saw Starlette's warning that its test client now wants `httpx2`. The AI swapped the dev dependency `httpx` for `httpx2`, and the warning is gone.
  - `/docs` stayed blank on my machine. The AI found that Swagger UI loads from a CDN that didn't respond, while `/openapi.json` worked; left as is.
- **How it was verified:** `make check` (4 tests, 100% coverage); `GET /api/health` on the running server returned `{"data":{"status":"ok"}}`.

## 2026-11-03 — Step A2: error contract

- **Prompt / instruction:** "commit and continue with next step", then "continue".
- **What the AI produced:**
  - failing tests first, against test-only routes, for each error type: unknown `/api/*` route → 404, invalid input → 422 with field `details`, `NotFoundError` → 404, `ConflictError` → 409, `DomainValidationError` → 422, unexpected exception → 500 with no internals in the body
  - `core/exceptions.py` (domain errors), `core/exception_handlers.py` (one place mapping them to `{ "error": ... }`), `constants/messages.py`, and `ErrorResponse` / `FieldError` schemas
  - domain error status codes live in one table, so a new error type needs no handler change; 500s log only the method and path, never the body
- **What I changed, rejected, or corrected, and why:**
  - Following my preference from A1, the AI wrote the code before asking to commit, then proposed the red and green commits separately.
  - The AI found its own unreachable fallback branch and removed it, and noticed a `ResourceWarning` from SQLite connections left open; it now closes the engine on app shutdown, in its own `fix` commit.
- **How it was verified:** `make check` (10 tests, 100% coverage); `pytest -W error::ResourceWarning` passes; `GET /api/nope` on the running server returned `{"error":"Not Found"}`.

## 2026-11-03 — Step A3: database and employee model

- **Prompt / instruction:** "Continue with A3".
- **What the AI produced:**
  - failing tests first: `foreign_keys` and WAL on every connection, a duplicate email rejected by the database, timestamps stored and read back in IST, `updated_at` changing on update while `created_at` stays, the migration creating every index, and the migration matching the models
  - `EmployeeModel` with the columns and indexes from `docs/architecture.md`, an `AppDateTime` column type, and a timestamp mixin whose clock tests can replace (no real clock in tests)
  - SQLite pragmas applied on every connection in `core/database.py`; Alembic set up to use the app's engine and settings, with the first migration
  - `tests/factories.py` with `build_employee()`
- **What I changed, rejected, or corrected, and why:**
  - The AI corrected its own plan: SQLAlchemy 2 ships its own typing, so the extra typing dependency it mentioned before A3 isn't needed; only Alembic was added.
  - The autogenerated migration referred to an app class without importing it; the AI changed it to a plain `DateTime`, so the migration never depends on app code that can change.
  - **Time zone:** I asked for IST as the default time zone. The AI pointed out that `CLAUDE.md` said UTC and offered three options (IST on screen only, IST from the API, IST everywhere); I chose IST everywhere. The AI updated `CLAUDE.md`, the architecture, the plan, and added ADR 15. It used a fixed +05:30 offset instead of the `Asia/Kolkata` zone database, which Windows and slim Docker images don't include; Kolkata has no daylight saving, so they are the same.
  - mypy found `tests/factories.py` under two module names; the AI set `explicit_package_bases` instead of adding `__init__.py` files to the test folders.
- **How it was verified:** `make check` (20 tests, 100% coverage); `pytest -W error::ResourceWarning`; `alembic upgrade head` and `downgrade base` against a temporary database.

## 2026-11-03 — Steps A4–A8: employee create, read, update, delete and list

- **Prompt / instruction:** "commit and continue with A4 to A8. I want list/create/update/delete API at once." Before starting, the AI asked three questions; I chose fixed lists for country, department and job title, sorting by every column, and soft delete.
- **What the AI produced:**
  - one red and one green commit per step: create (A4), duplicate email → 409 (A5), get one → 404 when missing (A6), partial update and soft delete (A7), and the list with pagination, filters, search and sort (A8)
  - request schemas that trim text, lowercase emails, and match country, department and job title to the fixed lists ignoring case; PATCH rejects an explicit `null`
  - salaries sent as strings (`"85000.00"`) so no float ever touches money
  - an `is_active` column, a partial unique email index (unique among active employees only), and indexes for the new sort columns, in a second migration
  - every repository query starts from `active_employees()`, so deleted employees never appear
  - the list: exact filters, case-insensitive substring search on name or email with `%` and `_` matched literally, an allow-listed `sort` (`-field` for descending), `id` as the tie-breaker so pages never overlap, and `meta` built only by `PaginatedResponse.create`
  - ADRs 16 (soft delete) and 17 (fixed lists); `email-validator` added with its reason
- **What I changed, rejected, or corrected, and why:**
  - A test written by the AI for two requests saving the same email at once found a real bug in its own code: the database error came from the `flush` inside the repository, outside the `try` that turned it into a 409, so the client would have got a 500. The service now wraps the whole save in one `_saving()` block.
  - I asked to see the working code before approving any commit. The AI kept a snapshot of the code at each red and green point, so the history still shows each test before its code, and replays them as commits after my OK.
  - Pylance warned that `@contextmanager` functions should return `Generator[None]`, not `Iterator[None]`. The AI fixed `_saving()` and updated every snapshot that contained it.
- **How it was verified:** `make check` (106 tests, 100% coverage); each red snapshot fails only because the code is missing; `alembic upgrade head`, `downgrade` and `upgrade` again on a temporary database.

## 2026-11-03 — Step A10: seed 10,000 employees

- **Prompt / instruction:** "commit the code and start A10 before A9." Asked first (question 9), I chose salary ranges per job title scaled by a country pay factor, and names from list files.
- **What the AI produced:**
  - failing tests first: the same seed gives identical employees and a different seed different ones; emails are unique, and a repeated name gets `asha.rao2@`; every employee passes the API's own validation after a JSON round-trip; department and salary follow the job title and country; every job title and country has a profile; the seed is skipped when employees exist; the script prints only counts and time
  - `scripts/seed.py` (builds employees through `EmployeeCreateRequest`, one bulk insert), `scripts/seed_constants.py` (ranges, pay factors, weights, fixed dates), and the name lists in `scripts/data/`
  - a `make seed` target; `mypy` and coverage now include `scripts/`
  - ADR 18, the README setup step, and question 9 marked answered
- **What I changed, rejected, or corrected, and why:**
  - After A8, the list returned a 500 on my machine: `no such column: employees.is_active`. My local database was still on the first migration. The fix is `uv run alembic upgrade head`; the README now says to rerun it after pulling.
  - I asked for A10 before A9, so the insights can be tried on realistic data.
  - The AI noticed its first `main` test left the "seed skipped" message untested and extended it.
- **How it was verified:** `make check` (117 tests, 100% coverage); the full seed on a freshly migrated database took 1.45–1.51 s over three runs (target: under 30 s; noted for `docs/performance.md`), with 10,000 unique emails; a second run was skipped.

## 2026-11-03 — Step A9: salary insights

- **Prompt / instruction:** "Commit the code and start the step A9?" Asked first (question 2), I chose one endpoint per insight, and averages rounded half-up to the cent.
- **What the AI produced:**
  - a `refactor` commit first, moving the `Money` type and a half-up `round_to_cents` into shared modules so employees and insights use one money rule
  - one red/green pair per insight, each tested on small hand-built data with known answers:
    - by country: headcount, min, max, average and median, for odd and even counts, and a half-cent average
    - by job title within a country: only the chosen country counts, and the country is required and validated
    - by department: headcount and average across countries
    - overview: headcount, total payroll and payroll by country
  - every insight leaves out deleted employees and returns empty lists and zeros, not errors, on an empty database
  - `salary_insight_repository.py` (one shared `GROUP BY` query), `salary_insight_service.py` (average from the exact sum, median in Python), resources, a request schema and the router; deleted employees are filtered by the same `is_active_employee()` as the employee list
  - ADR 19, the API outline, and question 2 marked answered; `CLAUDE.md`'s folder tree lists the two new money modules
- **What I changed, rejected, or corrected, and why:**
  - I asked for the seed (A10) before the insights, so they could be checked on real volumes.
  - The AI chose not to use SQLite's `AVG`, which returns a float, and divides the exact SQL sum instead, so no float touches money.
- **How it was verified:** `make check` (136 tests, 100% coverage); against the 10,000-employee seed, every insight answered in under 61 ms (target: under 300 ms; noted for `docs/performance.md`), and the overview total matched a raw SQL `SUM` to the cent.

## 2026-11-03 — API review checkpoint

- **Prompt / instruction:** "start api review checkpoint" (the plan's review of all of `api/` against `CLAUDE.md` and `docs/requirements.md`, after A10).
- **What the AI produced:** a review of every file in `api/`, with each suspicion checked against the 10,000-employee seed or a running server before it counted as a finding. Five fixes, each a failing test and then the fix:
  1. **The duplicate-email check scanned the whole table.** The active filter rendered as `is_active IS 1`, but SQLite uses the partial unique index only for `is_active = 1`, the index's own condition. `EXPLAIN QUERY PLAN` went from `SCAN employees` to `SEARCH … USING INDEX uq_employees_active_email`.
  2. **Database errors carried names and salaries into the logs.** SQLAlchemy puts query values in its error messages, which the 500 handler and uvicorn log. The engine now uses `hide_parameters=True`.
  3. **A huge `page` or employee id returned a 500** (`OverflowError`: too large for a SQLite integer). `page` is capped at `MAX_PAGE` and ids at SQLite's largest integer, so these are now 422s.
  4. **Responses weren't compressed,** although `CLAUDE.md` requires `GZipMiddleware`. Responses over 1 KB are now gzipped.
  5. **Uvicorn's access log wrote full query strings,** so `?search=` text (a name or an email) reached the logs. A logging filter drops the query string and keeps method, path and status.
- **What I changed, rejected, or corrected, and why:**
  - The AI's first index test expected a *covering* index, which only happens when the query selects nothing but `email`. It loosened the test to "uses the index", and the red snapshot still failed on the old code.
  - The AI's first test for the filter's fallback branch didn't reach it: a log call with no arguments still has an (empty) tuple. It switched to named arguments, which do.
  - Noted but not changed: `search` has no maximum length (harmless for a substring match on 10,000 rows); Starlette re-raises unhandled errors so uvicorn logs a second traceback (now free of query values); `DomainValidationError` has no user yet; CORS for the separate Vite dev server arrives with the web app (W2).
- **How it was verified:** `make check` (148 tests, 100% coverage); each red snapshot fails on the old code; a real uvicorn run showed `GET /api/v1/employees` without the query string, a gzipped list, and a 422 for a huge id.

## 2026-11-04 — Step W1: web scaffold

- **Prompt / instruction:** "continue with task W1".
- **What the AI produced:**
  - the scaffold commit: Vite 8, React 19, TypeScript and Mantine 9, the `@src` alias, `config/env.ts` (the only reader of `import.meta.env`), the Mantine theme on the same scale as the SCSS tokens, vendor chunks, and `app.tsx` holding the providers
  - the tooling commit: the ESLint and Stylelint configs from `CLAUDE.md`, Vitest with jsdom (stubbing `matchMedia` and `ResizeObserver` for Mantine), the `npm run check` script, and a smoke test that the app renders its heading
- **What I changed, rejected, or corrected, and why:**
  - **Versions:** the newest ESLint, TypeScript and Stylelint majors break the required plugins' peer ranges. The AI checked each range and pinned the newest versions that fit (ADR 20), instead of forcing the install.
  - Vite 8 uses Rolldown, which deprecates `manualChunks`; the AI used `codeSplitting.groups` and updated `CLAUDE.md` to match.
  - I asked whether the "Loading Salary Management…" text in `index.html` was planned. It is required by `CLAUDE.md` (safety net 1), but the plan schedules it in W3, and the AI had added it in W1. We moved it back to W3.
  - The AI checked that the rules fire on a probe file (`../` import, `any`, a missing return type) and that the strict-value rule accepts `spacing.$md` but rejects `15px`, so no extra plugin options are needed.
  - Not added yet: `sass-embedded` and `classnames`, because the first SCSS module doesn't exist yet.
  - `CLAUDE.md`'s backend tree now also lists `logging_filters.py` (from the API review).
- **How it was verified:** `npm run check` (lint, style lint, type check, 1 test) and `npm run build`. The build gives a 1.5 KB app chunk, 51 KB Mantine and 210 KB React (66 KB gzipped).

## 2026-11-04 — Step W2: API client and case conversion

- **Prompt / instruction:** "start with task W2".
- **What the AI produced:**
  - `utils/case_converter.ts`: pure functions that convert keys (never values) between snake_case and camelCase, recursing only into arrays and plain objects, so `FormData`, `Blob` and `Date` pass through untouched
  - `api/api_client.ts`: the one axios instance. The request interceptor converts body and query-param keys to snake_case; the response interceptor converts body keys to camelCase; the error interceptor turns every failure into an `IApiError` (the API's message, a 422's `details[].field` in camelCase, or a fallback for network errors and bodies that aren't ours)
  - `types/api_response.ts` (`IApiResponse<T>`, `IApiError`, `IFieldError`) and `constants/error_messages.ts`
- **What I changed, rejected, or corrected, and why:**
  - **axios version:** the newest release (1.21.0) was one week old; the AI pinned 1.20.0, the newest release at least two weeks old.
  - **No mocking library:** the tests swap the client's adapter for a stub that records the request and answers like the network would, so no `axios-mock-adapter` or MSW dependency is needed yet.
  - I asked to move on to W3 halfway through; the AI pointed out that the API client pair was still open and W4 needs it, so we finished W2 first.
  - **Deferred:** `withCredentials: true` arrives with login (auth is built last), and CORS for the Vite dev server arrives in W4, the first step where the browser calls the API.
- **How it was verified:** `npm run check` (lint, style lint, type check, 25 tests); each red snapshot fails because the module doesn't exist yet; `api/api_client.ts` is the only non-test file that imports axios.

## 2026-11-04 — Step W3: routing and error handling

- **Prompt / instruction:** "continue with W3".
- **What the AI produced:**
  - a chore commit adding `react-router`, `react-error-boundary` and `@mantine/notifications`
  - the stale-deploy reload: `is_chunk_load_error.ts`, and `reload_for_new_version.ts` with its `sessionStorage` loop guard (it reloads at most once per 10 seconds, and never when storage is unavailable, because an unguarded reload could loop)
  - routing: lazy employee list and salary insights pages (placeholders until W4 and W8) behind `route_boundary.tsx` (error boundary, then `Suspense` with the page skeleton), the app shell with the main navigation, `route_paths.ts`, and redirects from `/` and unknown paths to the employee list
  - the three boundary levels (root in `main.tsx`, app in `app.tsx`, route per page), the router's root `errorElement`, the `vite:preloadError` listener, and the static loading message and `<noscript>` in `index.html`
  - `use_global_error_listener.ts`: logs every error outside rendering, shows at most one notification per 5 seconds, and ignores chunk-load errors and `ResizeObserver` noise
- **What I changed, rejected, or corrected, and why:**
  - I asked to start W3 while W2's API client pair was still open; we finished W2 first.
  - **Versions:** `@mantine/notifications` is pinned to 9.7.4 because it requires exactly the same version as `@mantine/core`. `react-router` 8.5.0 (the newest release at least two weeks old) needs Node 22.22, so `engines` and the README now say 22.22.
  - `window.location.reload` lives in one tiny wrapper, `utils/reload_page.ts`, so tests can mock it as a module; jsdom doesn't allow replacing `location.reload`.
  - The app boundary sits in `app.tsx`, not `main.tsx` as `CLAUDE.md` said, because W1 put the providers in `app.tsx`; `CLAUDE.md` now matches. When the reload guard blocks a second reload, the `vite:preloadError` listener lets the error through, so the route boundary shows "A new version is available".
  - The app name moved from the page heading into the shell header (hidden on phones so the navigation fits); each page's `h1` is now its own title.
  - The AI's first listener test used a spy type that `tsc` rejected; it was fixed in the red commit, so that commit still type-checks.
- **How it was verified:** `npm run check` (lint, style lint, type check, 51 tests) and `npm run build`. Each lazy page is its own chunk (about 0.2 KB), and no path string is hardcoded outside `route_paths.ts` (checked with grep).

## 2026-11-04 — Step W4: employee list

- **Prompt / instruction:** "Start W4 to W7". Before starting, the AI asked the two open questions these steps depend on: create and edit as **modals with no view page** (question 1), and the dropdown lists **copied into the web constants** (question 3, decision 21).
- **What the AI produced:**
  - an API pair for CORS: `ALLOWED_ORIGINS` in `config.py` (empty by default) turns on `CORSMiddleware` with credentials, for the Vite dev server only
  - a chore commit adding React Query
  - the list: `getEmployees` → `useEmployeesQuery` (keeping the previous page as placeholder data) → the page, with a table skeleton on first load, an error state with retry, an empty state, the total count, a small "updating" indicator while the next page loads, and Mantine pagination
  - `format_currency.ts` (formats the decimal string directly, so it is never parsed into a float) and `format_date.ts` (in IST)
  - `ErrorState` and `EmptyState`; the boundaries' `ErrorFallback` now reuses `ErrorState` instead of repeating it
- **What I changed, rejected, or corrected, and why:**
  - **409 has no field:** a taken email returns only `{ "error": ... }`, so the form couldn't put it on the email input without special-casing the status. The AI planned an API pair for W6 that adds `details` with `field: "email"`, so the form's generic handling covers it.
  - Page state is a `useState` for now; W5 moves it to the URL, as the plan orders.
  - A smoke run against the real API failed with a 500. The cause was the AI's own mistake: it passed a POSIX path as the SQLite URL on Windows. Rerun with a Windows path, the preflight and the list both returned `access-control-allow-origin: http://localhost:5173`.
  - A shell heredoc with many files failed to parse; the AI wrote the remaining files one at a time.
- **How it was verified:** `make check` (151 tests, 100% coverage); `npm run check` (63 tests) and `npm run build`; each red snapshot fails before its green; CORS checked with curl against uvicorn on the 10,000-employee database.

## 2026-11-04 — Step W5: search, filters, sort and page size in the URL

- **Prompt / instruction:** part of "Start W4 to W7". Mid-step: "The employee table should have some fixed height and then scrollable."
- **What the AI produced:**
  - `use_list_url_state.ts`: the one hook that reads and writes page, page size, search, filters and sort in the URL. Values that aren't allowed fall back to the defaults, default values are left out of the URL, and any change other than the page goes back to page 1
  - a chore commit adding `@tabler/icons-react`
  - a debounced search box (300 ms); typing replaces the history entry, so each keystroke doesn't add a "back" step
  - the table's height is capped at 560 px with a sticky header, so the pagination stays on screen; the skeleton draws only the rows that fit
  - Selects for country, job title and department, and a "No employees match these filters" state with a "Clear filters" button that keeps the sort
  - sortable column headers: the first click sorts ascending, the second reverses it; the direction is shown by an icon and announced with `aria-sort`
- **What I changed, rejected, or corrected, and why:**
  - The search uses Mantine's `useDebouncedValue` instead of our own `use_debounced_value.ts` hook, which `CLAUDE.md` listed; that is a library hook we already ship, so `CLAUDE.md` now points to it.
  - Mantine's Select has the `combobox` role and the search input the `searchbox` role; the AI's first tests looked for `textbox` and were fixed in their red commits. The tests turn off Mantine's transitions (`env="test"`), so dropdown options are visible straight away.
  - The debounced-search test failed once in a full run: under load the re-render took longer than `waitFor`'s 1 s default. Its wait is now 3 s, fixed in the red commit that added it.
- **How it was verified:** `npm run check` (90 tests), run twice to check the timing fix; each red snapshot fails before its green.

## 2026-11-04 — Step W6: add and edit employees

- **Prompt / instruction:** part of "Start W4 to W7"; question 1 answered as "modals, no view page".
- **What the AI produced:**
  - an API pair: a domain error can name the field it is about, and a taken email now returns `details: [{ "field": "email", ... }]` with its 409, so the form's generic field-error handling covers it
  - a chore commit adding `@mantine/form`
  - an "Add employee" button and an edit button on each row (labelled "Edit <name>"), both opening one form in a Mantine `Modal`
  - `employee_form_validation.ts`: the API's rules checked first for quick feedback; the salary is checked as text (up to 10 digits and 2 decimals, more than 0), so it is never parsed into a float
  - `useCreateEmployeeMutation` and `useUpdateEmployeeMutation`: a notification on success and failure, and the list reloads after a save; server field errors appear on their inputs and the modal stays open
  - edit sends only the fields that changed, and closes without a request when nothing did
  - `show_notification.ts`, now also used by the global error listener
- **What I changed, rejected, or corrected, and why:**
  - The plan had the form in `common/employee_form/`, written when create and edit were separate routes. With modals, only the list page uses it, so it lives in `pages/employee_list/` (decision 22).
  - `@mantine/modals` was first installed here too, but only the delete confirmation (W7) needs it, so it moved to W7. Add and edit use Mantine's own `Modal`.
  - The hire date uses a native date input (`type="date"`): it gives the ISO string the API expects, with no date library.
  - Two AI mistakes caught by the tests: React Query passes a second argument to `mutationFn`, so passing `createEmployee` directly sent it to the mocked API; and Mantine 9's `useForm` takes the transformed type, not a function type, as its second generic.
  - Filling the form opens three Mantine Selects, which takes several seconds in jsdom, so the form tests have a 20 s timeout.
- **How it was verified:** `make check` (153 tests, 100% coverage); `npm run check` (102 tests); each red snapshot fails before its green.

## 2026-11-04 — Step W7: delete employees

- **Prompt / instruction:** part of "Start W4 to W7".
- **What the AI produced:**
  - a chore commit adding `@mantine/modals`
  - a delete button on each row (labelled "Delete <name>") that opens a confirmation modal naming the employee
  - `useDeleteEmployeeMutation`: a notification on success and failure, then the list reloads; the confirm button shows the loading state and the modal stays open if the delete fails
  - deleting the only employee on the last page steps back a page, through the list's existing "page past the end" rule
- **What I changed, rejected, or corrected, and why:**
  - Mantine's `openConfirmModal` sets the button props once, when the modal opens, so it can't show the loading state while the delete runs. The modal body is our own small component instead, which runs the mutation itself.
  - With two icon buttons per row, an existing test failed: the page took just over Testing Library's 1 s default wait to re-render in jsdom. A separate test commit raises the default to 3 s in `vitest.setup.ts`, instead of patching single tests.
- **How it was verified:** `npm run check` (108 tests); each red snapshot fails before its green.

## 2026-11-05 — Step W7.1: dropdown lists from the API

- **Prompt / instruction:** "We have list of country, job title and department in backend. So there should only one source of truth. We should use those list in frontend via api"
- **What the AI produced:**
  - an API pair: `GET /api/v1/employee-options` returns `{ countries: [{ code, name }], departments, job_titles }`, built from the backend's enums; the country display names moved into `COUNTRY_NAMES` next to the `Country` enum
  - a web pair: `useEmployeeOptionsQuery` (cached for the visit), used by the filters, the employee form, the table's country column and the URL check; the copied lists are gone from `employee_constants.ts`
  - the list page shows the table skeleton until the lists arrive, and an error with a retry if they fail
- **What I changed, rejected, or corrected, and why:**
  - This reverses decision 21. The AI had recommended copying the lists to save a request, and I accepted it in W4; at review I chose one source of truth over saving one small cached request.
  - The new tests live in their own file and use values only the API knows (New Zealand, Research), so a copy kept in the web app could not pass them. The existing test files get a default options mock in the green commit, where the page starts needing it, so the red commit fails only the new tests.
- **How it was verified:** `make check` (156 tests, 100% coverage); `npm run check` (114 tests); each red snapshot fails before its green.

## 2026-11-05 — Step W7.2: clear the sort

- **Prompt / instruction:** "How can i clear the sorting? There should a way to clear the sort."
- **What the AI produced:** a red/green pair with two ways back to the default sort (name A to Z), both removing `sort` from the URL and going back to page 1:
  - a third click on a sorted column header clears it (ascending → descending → default)
  - a "Reset sort" button next to the employee count, shown only while a sort other than the default is applied, so the option can be seen without knowing the click cycle
- **What I changed, rejected, or corrected, and why:** W5 only toggled between ascending and descending, so once a column was sorted the default could only be reached by editing the URL. "Clear filters" still keeps the sort, as before: the two are separate controls.
- **How it was verified:** `npm run check` (116 tests); the red snapshot fails only the two new tests.
