# Clarifications

Product questions sent to Incubyte on 30 Oct 2026, before any building started. No reply had arrived by 3 Nov 2026, so each answer below is a documented assumption, as the email said it would be. If Incubyte replies, their answer replaces the assumption and the requirements are updated.

## 1. Currency

**Question:** Employees are in several countries. Should I store each salary in its local currency, and do the insights need to compare across countries in one currency (e.g. USD)? If so, can I use fixed, configurable exchange rates instead of a live FX feed?

**Answer (Assumed):** All salaries are stored and shown in USD only. There are no local currencies and no exchange rates.

**Build impact:** No currency column or conversion. Every salary figure can be compared, sorted and totalled across countries directly.

## 2. Employee data

**Question:** Is there a minimum set of employee fields you expect (e.g. name, job title, department, country, salary, hire date)? Should salary be base pay only, or include bonus and allowances?

**Answer (Assumed):** Full name, email, job title, department, country, hire date and annual salary. Salary is base pay only.

**Build impact:** One employee table. Email is unique, because it is the natural way to catch duplicate records.

## 3. Salary history

**Question:** Does the HR manager need to see past salary changes, or only the current salary?

**Answer (Assumed):** Current salary only.

**Build impact:** Editing an employee overwrites the salary. There is no history table.

## 4. Insights

**Question:** Which questions should the HR manager be able to answer? For example: min/max/average salary by country, average salary by job title within a country, headcount by department. Are there any others you consider essential?

**Answer (Assumed):**
- By country: headcount, and minimum, maximum, average and median salary
- By job title within a country: headcount and average salary
- By department: headcount and average salary
- Org overview: headcount, total annual payroll, and payroll by country

**Build impact:** Aggregates run in SQL. Median runs in Python, because SQLite has no median function.

## 5. Users and access

**Question:** Is it one HR manager, or do you need login and role-based access? Is it fine to leave authentication out of scope?

**Answer (Assumed):** One HR manager with a login. No roles, sign-up or password reset.

**Build impact:** The app holds salary data on a public URL, so it needs a login. It is built last, on top of a finished app, and one seeded demo user is listed in the README.

## 6. Bulk import

**Question:** The HR team uses Excel today. Is importing from Excel/CSV expected, or is the seed script enough?

**Answer (Assumed):** The seed script is enough.

**Build impact:** No upload feature. The seed script creates all 10,000 employees.
