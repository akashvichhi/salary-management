"""The allowed values for employee fields. The seed data and the UI dropdowns use the same lists."""

from enum import StrEnum

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
