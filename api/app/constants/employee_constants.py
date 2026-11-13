"""The allowed values for employee fields: the one source of truth for validation, the seed data
and the web app's dropdowns, which load them from GET /api/v1/employee-options (decision 21)."""

from enum import StrEnum

from app.constants.currency_constants import Currency

FULL_NAME_MAX_LENGTH = 100
SALARY_MAX_DIGITS = 12
SALARY_DECIMAL_PLACES = 2


class Country(StrEnum):
    """ISO 3166-1 alpha-2 codes."""

    AUSTRALIA = "AU"
    CANADA = "CA"
    FRANCE = "FR"
    GERMANY = "DE"
    INDIA = "IN"
    NETHERLANDS = "NL"
    SINGAPORE = "SG"
    UNITED_ARAB_EMIRATES = "AE"
    UNITED_KINGDOM = "GB"
    UNITED_STATES = "US"


COUNTRY_NAMES: dict[Country, str] = {
    Country.AUSTRALIA: "Australia",
    Country.CANADA: "Canada",
    Country.FRANCE: "France",
    Country.GERMANY: "Germany",
    Country.INDIA: "India",
    Country.NETHERLANDS: "Netherlands",
    Country.SINGAPORE: "Singapore",
    Country.UNITED_ARAB_EMIRATES: "United Arab Emirates",
    Country.UNITED_KINGDOM: "United Kingdom",
    Country.UNITED_STATES: "United States",
}

# The currency an employee's salary is stored in: their country's (decision 4).
COUNTRY_CURRENCIES: dict[Country, Currency] = {
    Country.AUSTRALIA: Currency.AUD,
    Country.CANADA: Currency.CAD,
    Country.FRANCE: Currency.EUR,
    Country.GERMANY: Currency.EUR,
    Country.INDIA: Currency.INR,
    Country.NETHERLANDS: Currency.EUR,
    Country.SINGAPORE: Currency.SGD,
    Country.UNITED_ARAB_EMIRATES: Currency.AED,
    Country.UNITED_KINGDOM: Currency.GBP,
    Country.UNITED_STATES: Currency.USD,
}


class Department(StrEnum):
    CUSTOMER_SUPPORT = "Customer Support"
    DESIGN = "Design"
    ENGINEERING = "Engineering"
    FINANCE = "Finance"
    HUMAN_RESOURCES = "Human Resources"
    LEGAL = "Legal"
    MARKETING = "Marketing"
    OPERATIONS = "Operations"
    PRODUCT = "Product"
    SALES = "Sales"


class JobTitle(StrEnum):
    ACCOUNT_MANAGER = "Account Manager"
    ACCOUNTANT = "Accountant"
    CONTENT_WRITER = "Content Writer"
    DATA_ANALYST = "Data Analyst"
    DATA_SCIENTIST = "Data Scientist"
    DEVOPS_ENGINEER = "DevOps Engineer"
    ENGINEERING_MANAGER = "Engineering Manager"
    FINANCIAL_ANALYST = "Financial Analyst"
    HR_GENERALIST = "HR Generalist"
    LEGAL_COUNSEL = "Legal Counsel"
    MARKETING_SPECIALIST = "Marketing Specialist"
    OPERATIONS_MANAGER = "Operations Manager"
    PRODUCT_DESIGNER = "Product Designer"
    PRODUCT_MANAGER = "Product Manager"
    QA_ENGINEER = "QA Engineer"
    RECRUITER = "Recruiter"
    SALES_EXECUTIVE = "Sales Executive"
    SENIOR_SOFTWARE_ENGINEER = "Senior Software Engineer"
    SOFTWARE_ENGINEER = "Software Engineer"
    SUPPORT_SPECIALIST = "Support Specialist"


class EmployeeSortField(StrEnum):
    """The columns the list can be sorted by (an allow-list, so no other column can be reached)."""

    FULL_NAME = "full_name"
    EMAIL = "email"
    JOB_TITLE = "job_title"
    DEPARTMENT = "department"
    COUNTRY = "country"
    SALARY = "salary"
    HIRE_DATE = "hire_date"


DEFAULT_EMPLOYEE_SORT = EmployeeSortField.FULL_NAME
DESCENDING_SORT_PREFIX = "-"
