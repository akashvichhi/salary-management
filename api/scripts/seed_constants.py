"""What the seed data looks like: who works where, and what each role is paid.

Salaries are annual USD. A job title has one base range (US pay); a country's pay factor
scales it, so the insights show real differences by country and by job title.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

from app.constants.employee_constants import Country, Department, JobTitle

SEED_EMPLOYEE_COUNT = 10_000
SEED_RANDOM_SEED = 42
SEED_EMAIL_DOMAIN = "example.com"  # reserved for examples, so no real inbox is ever named
SALARY_ROUNDING = 100

# Fixed dates, so the data never depends on the day the seed runs.
EARLIEST_HIRE_DATE = date(2015, 1, 1)
LATEST_HIRE_DATE = date(2026, 10, 31)

NAMES_DIRECTORY = Path(__file__).parent / "data"
FIRST_NAMES_FILE = NAMES_DIRECTORY / "first_names.txt"
LAST_NAMES_FILE = NAMES_DIRECTORY / "last_names.txt"


@dataclass(frozen=True)
class JobProfile:
    department: Department
    min_salary: int
    max_salary: int
    weight: int  # how common the role is, relative to the others


@dataclass(frozen=True)
class CountryProfile:
    pay_factor: Decimal
    weight: int


JOB_PROFILES: dict[JobTitle, JobProfile] = {
    JobTitle.ACCOUNT_MANAGER: JobProfile(Department.SALES, 60_000, 120_000, 6),
    JobTitle.ACCOUNTANT: JobProfile(Department.FINANCE, 50_000, 90_000, 4),
    JobTitle.CONTENT_WRITER: JobProfile(Department.MARKETING, 40_000, 80_000, 3),
    JobTitle.DATA_ANALYST: JobProfile(Department.OPERATIONS, 55_000, 105_000, 5),
    JobTitle.DATA_SCIENTIST: JobProfile(Department.ENGINEERING, 90_000, 170_000, 4),
    JobTitle.DEVOPS_ENGINEER: JobProfile(Department.ENGINEERING, 80_000, 150_000, 5),
    JobTitle.ENGINEERING_MANAGER: JobProfile(Department.ENGINEERING, 140_000, 230_000, 3),
    JobTitle.FINANCIAL_ANALYST: JobProfile(Department.FINANCE, 60_000, 110_000, 3),
    JobTitle.HR_GENERALIST: JobProfile(Department.HUMAN_RESOURCES, 45_000, 85_000, 3),
    JobTitle.LEGAL_COUNSEL: JobProfile(Department.LEGAL, 100_000, 190_000, 2),
    JobTitle.MARKETING_SPECIALIST: JobProfile(Department.MARKETING, 50_000, 95_000, 5),
    JobTitle.OPERATIONS_MANAGER: JobProfile(Department.OPERATIONS, 70_000, 130_000, 3),
    JobTitle.PRODUCT_DESIGNER: JobProfile(Department.DESIGN, 70_000, 135_000, 4),
    JobTitle.PRODUCT_MANAGER: JobProfile(Department.PRODUCT, 100_000, 180_000, 4),
    JobTitle.QA_ENGINEER: JobProfile(Department.ENGINEERING, 55_000, 110_000, 6),
    JobTitle.RECRUITER: JobProfile(Department.HUMAN_RESOURCES, 45_000, 90_000, 3),
    JobTitle.SALES_EXECUTIVE: JobProfile(Department.SALES, 45_000, 95_000, 8),
    JobTitle.SENIOR_SOFTWARE_ENGINEER: JobProfile(Department.ENGINEERING, 110_000, 190_000, 10),
    JobTitle.SOFTWARE_ENGINEER: JobProfile(Department.ENGINEERING, 70_000, 140_000, 20),
    JobTitle.SUPPORT_SPECIALIST: JobProfile(Department.CUSTOMER_SUPPORT, 35_000, 65_000, 8),
}

COUNTRY_PROFILES: dict[Country, CountryProfile] = {
    Country.AUSTRALIA: CountryProfile(Decimal("0.85"), 5),
    Country.CANADA: CountryProfile(Decimal("0.80"), 6),
    Country.FRANCE: CountryProfile(Decimal("0.75"), 4),
    Country.GERMANY: CountryProfile(Decimal("0.85"), 7),
    Country.INDIA: CountryProfile(Decimal("0.30"), 30),
    Country.NETHERLANDS: CountryProfile(Decimal("0.80"), 4),
    Country.SINGAPORE: CountryProfile(Decimal("0.80"), 5),
    Country.UNITED_ARAB_EMIRATES: CountryProfile(Decimal("0.75"), 4),
    Country.UNITED_KINGDOM: CountryProfile(Decimal("0.80"), 10),
    Country.UNITED_STATES: CountryProfile(Decimal("1.00"), 25),
}
