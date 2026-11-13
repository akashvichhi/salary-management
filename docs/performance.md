# Performance

Measured numbers behind the performance targets in [`requirements.md`](requirements.md): list and insights requests under 300 ms with 10,000 employees, and a seed under 30 seconds.

## How it was measured

- **Data:** a fresh SQLite file, migrated with `alembic upgrade head` and filled by `python -m scripts.seed`: the full 10,000 employees.
- **Requests:** FastAPI's `TestClient`, in process, logged in as the HR manager. Each request ran once to warm up, then 30 times; the tables show the median and the 95th percentile. This measures the app and the database, not the network.
- **Machine:** a Windows 11 laptop, Python 3.13, SQLite in WAL mode. Measured on 2026-11-05; the default list and the insights were measured again on 2026-11-10, after the name index became `NOCASE` and the insight sums moved to whole cents, and once more on 2026-11-13, after salaries moved to local currency (section below).
- **Bundle:** `npm run build` (Vite 8, Rolldown), sizes as Vite reports them.

## Seed

| Measure | Time |
|---|---|
| The seed script's own timer: 10,000 rows built and inserted in one bulk insert | **3.26 s** |
| The whole command, including Python start-up and the HR manager's Argon2 hash | 11.86 s |
| Inside the Docker image, on container start | 1.50 s |

Target: under 30 seconds. The fixed random seed makes every run produce the same data.

## API response times

**List** (`GET /api/v1/employees`, 20 per page unless noted):

| Request | Median | p95 | Body |
|---|---|---|---|
| Default (page 1, sorted by name) | 7.4 ms | 9.1 ms | 5.8 kB |
| Page 250 (offset 4,980) | 15.0 ms | 17.5 ms | |
| `per_page=100`, the maximum | 17.5 ms | 20.5 ms | 28.7 kB before gzip |
| Filter `country=IN` | 16.1 ms | 19.3 ms | |
| Filters country + job title + department | 12.6 ms | 14.3 ms | |
| Search `kumar` | 40.3 ms | 49.5 ms | |
| Search with no match | 58.2 ms | 67.5 ms | |
| Sort `-salary` | 24.2 ms | 52.0 ms | |
| Sort `hire_date` + filter `country=US` | 30.3 ms | 56.3 ms | |

**Insights** (`GET /api/v1/salary-insights/...`):

| Request | Median | p95 | Body |
|---|---|---|---|
| `overview` | 12.0 ms | 16.3 ms | 0.7 kB |
| `by-country` (includes the median per country) | 52.7 ms | 82.0 ms | 1.4 kB |
| `by-job-title?country=IN` | 9.8 ms | 20.2 ms | |
| `by-department` | 29.5 ms | 76.0 ms | |

Every request is well under the 300 ms target. The slowest, `by-country`, reads each country's salaries into Python for the median, which SQLite can't compute (decision 5).

**After salaries moved to local currency** (2026-11-13, decision 4). The salary sort now divides by the country's rate in SQL, and the overview and department insights convert per-country totals to USD. Measured the same way, on the same laptop under more load: the unchanged default list took 17.7 ms instead of 7.4, so compare the rows with that baseline, not with the tables above.

| Request | Median | p95 |
|---|---|---|
| Default list (unchanged, the baseline) | 17.7 ms | 20.5 ms |
| List, filter `country=IN` | 18.3 ms | 23.9 ms |
| List, sort `-salary` (in USD) | 25.2 ms | 31.1 ms |
| List, sort `salary` + filter `country=US` | 18.8 ms | 25.4 ms |
| `overview` | 20.2 ms | 26.1 ms |
| `by-country` | 80.9 ms | 113.1 ms |
| `by-job-title?country=IN` | 15.3 ms | 20.3 ms |
| `by-department` (now grouped by department and country) | 26.0 ms | 33.1 ms |

The USD sort costs about 8 ms over the baseline, and every request stays under the target. A first run, with the laptop busier still, had `by-country` at a 317 ms p95; the second run above is the one recorded.

## Query plans

`EXPLAIN QUERY PLAN` for the SQL each endpoint runs:

| Query | Plan |
|---|---|
| List, count | `SCAN employees USING COVERING INDEX uq_employees_active_email` |
| List, default page | `SCAN employees USING INDEX ix_employees_full_name`: the rows come out in name order, so no sort step. The index uses the column's `NOCASE` collation, so the name sort ignores case and still needs no sort step |
| List, country + job title + department | `SEARCH employees USING INDEX ix_employees_country_job_title (country=? AND job_title=?)`, then `USE TEMP B-TREE FOR ORDER BY` |
| List, `country=IN` | Count: `SEARCH ... ix_employees_country_job_title (country=?)`. Rows: `SEARCH ... ix_employees_country (country=?)`, then a temp B-tree for the order |
| List, search | `SCAN employees`: a substring match (`LIKE '%kumar%'`) can't use an index |
| List, sort `-salary` | `SCAN employees USING INDEX uq_employees_active_email`, then `USE TEMP B-TREE FOR ORDER BY` on salary ÷ the country's rate |
| Insights `overview`, `by-country` | `SCAN employees USING INDEX ix_employees_country` |
| Insights `by-job-title` | `SEARCH employees USING INDEX ix_employees_country_job_title (country=?)` |
| Insights `by-department` | `SCAN employees USING INDEX ix_employees_department` |

**The salary sort has no index.** It orders by the salary in USD, an expression of two columns (salary ÷ a `CASE` on country, decision 4), which no column index can serve, so `ix_employees_salary` was dropped. Even before, the planner never used it: it preferred the partial unique index on `email` (`WHERE is_active = 1`), which holds exactly the listed rows, then sorted them. Sorting 10,000 rows takes a few milliseconds. An expression index would have to change with every new exchange rate.

**Search scans the table** (open question 5). It is the slowest list request, at 40 to 58 ms, and still about a sixth of the target. Full-text search (SQLite FTS5) would avoid the scan, but it needs a second table kept in sync with triggers. It is worth it only with far more rows.

**The `country` index and the composite `(country, job_title)`** (open question 6). The composite has `country` as its first column, so it could serve country lookups alone. With `ix_employees_country` dropped, the planner switches to the composite, and the requests get slightly slower:

| Request | With `ix_employees_country` | Without |
|---|---|---|
| List, `country=IN` | 17.7 ms | 23.6 ms |
| `overview` | 19.3 ms | 23.4 ms |
| `by-country` | 80.5 ms | 89.3 ms |

The single-column index is smaller, so a scan reads fewer pages. Both stay.

## Frontend bundle

Sizes from `npm run build`. File names are content hashes; the chunks are identified by their contents.

**Initial load** (everything `index.html` loads):

| Chunk | Size | Gzip |
|---|---|---|
| `vendor-mantine` | 345.4 kB | 101.8 kB |
| `vendor-react` (React, React DOM, React Router) | 302.9 kB | 95.6 kB |
| App code: routes, layout, API client, shared hooks | 62.8 kB | 23.6 kB |
| `vendor-query` (TanStack Query) | 34.9 kB | 10.2 kB |
| `vendor-icons` (only the icons used) | 10.0 kB | 3.8 kB |
| Runtime helpers | 0.7 kB | 0.4 kB |
| CSS (Mantine's stylesheets) | 276.2 kB | 39.5 kB |
| `index.html` | 0.9 kB | 0.4 kB |
| **Total** | **1,033.7 kB** | **275.3 kB** |

**Lazy chunks** (loaded when a page is first opened):

| Chunk | Size | Gzip |
|---|---|---|
| Employee list page | 11.6 kB | 4.0 kB |
| Salary insights page | 5.4 kB | 2.0 kB |
| Employee options query (shared by both pages) | 2.4 kB | 1.0 kB |
| Employee constants and messages (shared) | 1.7 kB | 0.8 kB |
| Login page | 1.6 kB | 0.8 kB |
| Employee form validation | 0.4 kB | 0.3 kB |

The vendor chunks change only when a dependency changes, so after a deploy a returning browser downloads just the app chunk and the pages that changed. Every file under `/assets/` is cached for a year (`immutable`).

## Optimisations applied

| Optimisation | Where | Effect |
|---|---|---|
| Server-side pagination, at most 100 rows per page | `PaginationRequest`, decision 7 | A list response is 6 kB, not 10,000 rows |
| An index on every filtered, sorted or grouped column, plus `(country, job_title)` | `employee_model.py`, architecture section 4 | The plans above: index searches and ordered scans |
| Aggregation in SQL (`GROUP BY`) | `salary_insight_repository.py`, decision 5 | Only the median reads salaries into Python |
| Gzip for responses over 1,000 bytes | `GZipMiddleware` in `main.py` | Larger list pages shrink; tiny responses skip the cost |
| One bulk insert in the seed | `scripts/seed.py` | 10,000 rows in about 3 seconds |
| SQLite WAL mode | `core/database.py` | Reads aren't blocked while a write runs |
| Plain `def` endpoints | every router, decision 14 | A slow query blocks a worker thread, never the event loop |
| Keep the previous page while the next loads | `keepPreviousData` in `employee_queries.ts` | The table never flashes empty between pages |
| 30-second `staleTime` | `query_client.ts` | Moving between pages doesn't refetch fresh data |
| Search debounced by 300 ms | `use_search_input.ts` | One request per pause in typing, not per key |
| Lazy-loaded pages | `app_router.tsx` | The first load skips the code of pages not yet opened |
| Vendor chunks | `vite.config.ts` | Dependencies stay cached across deploys |
| Year-long `immutable` cache for `/assets/*`, `no-cache` for `index.html` | `core/web_app.py` | Repeat visits load from the cache; a deploy is still picked up |
| Memoised rows, columns and callbacks | `employee_table.tsx`, page hooks | Rows don't re-render when unrelated state changes |

## Deliberately skipped

| Not done | Why |
|---|---|
| List virtualisation | A page shows at most 100 rows, which the browser renders without trouble |
| Keyset (cursor) pagination | Page 250 takes 15 ms with `OFFSET`. Keyset paging can't jump to a page number, which the paginator needs |
| A cache for the insights | The slowest insight takes 53 ms (median), and a cache would have to be cleared on every edit |
| Full-text search (FTS5) | The substring scan takes under 60 ms at 10,000 rows; FTS5 needs a second table and triggers |
| An index for the salary sort | It sorts by salary in USD, an expression that changes with the exchange rates; the sort step costs a few milliseconds at this size (see the query plans) |
| Splitting Mantine further | Its components are shared by every page, so splitting it would only add requests |
