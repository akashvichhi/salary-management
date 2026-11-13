# Clarifications

Product questions sent to Incubyte on 30 Oct 2026, before any building started. No reply had arrived by 3 Nov 2026, so the app was first built on documented assumptions, as the email said it would be. Incubyte replied on 12 Nov 2026; each answer below is now theirs, with the assumption it replaced where they differ.

## 1. Currency

**Question:** Employees are in several countries. Should I store each salary in its local currency, and do the insights need to compare across countries in one currency (e.g. USD)? If so, can I use fixed, configurable exchange rates instead of a live FX feed?

**Answer (Incubyte, 12 Nov 2026):** "Yes, store salaries in local currency. Comparing across countries in one currency is optional. If you do it, fixed, configurable exchange rates are fine."

**Replaced assumption:** all salaries in USD, with no exchange rates.

**Build impact:** each salary is stored in its country's currency, which follows from the country, so it is never stored (decision 4). Figures that add up several countries (total payroll, the department averages, the salary sort) are converted to USD at fixed rates set by `EXCHANGE_RATES`. A migration converted the existing USD salaries.

## 2. Employee data

**Question:** Is there a minimum set of employee fields you expect (e.g. name, job title, department, country, salary, hire date)? Should salary be base pay only, or include bonus and allowances?

**Answer (Incubyte, 12 Nov 2026):** no required set of fields; the list is a reasonable start, and base pay only is fine. Kept: full name, email, job title, department, country, hire date and annual base salary.

**Build impact:** One employee table. Email is unique, because it is the natural way to catch duplicate records.

## 3. Salary history

**Question:** Does the HR manager need to see past salary changes, or only the current salary?

**Answer (Incubyte, 12 Nov 2026):** current salary only or history are both acceptable, with the choice explained. Kept: current salary only, because no chosen insight needs history (`docs/requirements.md`).

**Build impact:** Editing an employee overwrites the salary. There is no history table.

## 4. Insights

**Question:** Which questions should the HR manager be able to answer? For example: min/max/average salary by country, average salary by job title within a country, headcount by department. Are there any others you consider essential?

**Answer (Incubyte, 12 Nov 2026):** the examples are a good start; choosing the essential questions is part of the assessment. Kept:
- By country: headcount, and minimum, maximum, average and median salary
- By job title within a country: headcount and average salary
- By department: headcount and average salary
- Org overview: headcount, total annual payroll, and payroll by country

**Build impact:** Aggregates run in SQL. Median runs in Python, because SQLite has no median function.

## 5. Users and access

**Question:** Is it one HR manager, or do you need login and role-based access? Is it fine to leave authentication out of scope?

**Answer (Incubyte, 12 Nov 2026):** a single HR manager is fine, and leaving authentication out is acceptable. Kept: one HR manager with a login, because the app is on a public URL. No roles, sign-up or password reset.

**Build impact:** The app holds salary data on a public URL, so it needs a login. It is built last, on top of a finished app, and one seeded demo user is listed in the README.

## 6. Bulk import

**Question:** The HR team uses Excel today. Is importing from Excel/CSV expected, or is the seed script enough?

**Answer (Incubyte, 12 Nov 2026):** the seed script is enough; import is optional.

**Build impact:** No upload feature. The seed script creates all 10,000 employees.
