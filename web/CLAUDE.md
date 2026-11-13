# Frontend rules: Salary Management

@../docs/standards/react-typescript.md

## Project-specific frontend rules

- **Pages:** `login`, `employee_list`, `salary_insights`.
- **Lists loaded from the API, never copied:** countries, departments, and job titles from `GET /api/v1/employee-options` (decision 21).
- **Time and money constants** (`constants/time_constants.ts`): `APP_LOCALE`, `REPORTING_CURRENCY` (USD, for figures across countries), and `APP_DATE_FORMAT = 'DD/MM/YYYY'`, which `theme.ts` also sets as the date inputs' default. No time-zone constant: the UI shows dates only, so none is needed until a timestamp is shown (then in IST).
- **Add and edit happen in modals on the list page** (decision 22), so the employee form lives in `pages/employee_list/components/`. `src/common/` stays empty until a second page needs a component.
- **Search debounce:** Mantine's `useDebouncedCallback`, in `pages/employee_list/hooks/use_search_input.ts`.
- **API URL:** `VITE_API_URL` is left unset in production (same origin), so `API_URL` falls back to `/`.
- **Demo-only env vars:** `VITE_DEMO_LOGIN_EMAIL` and `VITE_DEMO_LOGIN_PASSWORD` (optional) prefill the login form (decision 24). Anyone can read them in the built JavaScript, so they only ever hold the demo account. Tests blank them in `vite.config.ts` (`test.env`).
- **`index.html` static message:** "Loading Salary Management… If this page doesn't appear, please refresh."
- **No external error-tracking service** (out of scope); boundaries log with `console.error` only.
- **Tool versions held back:** ESLint 9, TypeScript 6.0, Stylelint 17, until every plugin's peer range allows the next major (decision 20).
