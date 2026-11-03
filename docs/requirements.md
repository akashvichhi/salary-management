# Salary Management: Requirements

**Goal:** a web app where ACME's HR manager manages salary data for 10,000 employees across countries and can answer how the org pays people.

**Persona:** the HR manager. **Problem:** salary data lives in Excel files, which is tedious to maintain and hard to question.

## In scope, in priority order

1. **Employee records:** add, view, edit and delete, with validation and unique emails.
2. **Finding employees:** paginated list with search by name or email, filters by country, job title and department, and sorting.
3. **Salary insights:** by country (headcount, min, max, average, median), by job title within a country (headcount, average), by department (headcount, average), and an org overview (headcount, total payroll, payroll by country).
4. **Seed script:** 10,000 realistic, repeatable employees.
5. **Delivery:** deployed app and video demo.
6. **Login:** one HR manager, because this is sensitive data on a public URL. Built last.

## Deliberately left out

| Item | Why |
|---|---|
| Multi-currency, exchange rates | One currency keeps every figure comparable; rates add complexity without adding a feature |
| Payroll processing | This app records salaries; it doesn't pay them |
| Salary history | No listed insight needs it; first improvement to add next |
| Bonus and allowances | Need their own rules and schedules; base pay answers the core questions |
| Excel/CSV import | Needs validation and bad-row reports; the seed script fills the app for now |
| Roles, sign-up, password reset | Only one user; a real deployment would use company SSO |
| Pay-equity analysis | Needs sensitive fields nobody asked for |
| Charts | Tables and stat cards give the exact numbers |
| AI features in the product | Not part of the problem |

## Assumptions

Incubyte had not replied when this was written, so these are **Assumed** (details in `docs/clarifications.md`):

- **Assumed:** all salaries are annual base pay in USD.
- **Assumed:** one employee has one record and one current salary.
- **Assumed:** one HR manager uses the app at a time.
- **Assumed:** the deployed demo may reset to seed data on restart.

## Success criteria

- The HR manager can complete add, edit, delete, find and every insight on the deployed app, with no spreadsheet.
- With 10,000 employees, list and insights requests each respond in under 300 ms on a local run.
- The seed script finishes in under 30 seconds and produces identical data on every run.
- Services and repositories have at least 90% test coverage, and all checks pass before every push.
