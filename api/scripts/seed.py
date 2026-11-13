"""Seeds the database with 10,000 employees, the same ones on every run, and the HR manager.

Run from api/: `uv run python -m scripts.seed` (after `uv run alembic upgrade head`).
"""

import random
import time
from datetime import date, timedelta
from decimal import Decimal
from enum import Enum
from pathlib import Path

from sqlalchemy import func, insert, select
from sqlalchemy.orm import Session

from app.constants.currency_constants import DEFAULT_EXCHANGE_RATES
from app.constants.employee_constants import Country
from app.core.config import Settings, get_settings
from app.core.currency_converter import currency_of
from app.core.database import create_database_engine, create_session_factory
from app.core.security import hash_password
from app.models.employee_model import EmployeeModel
from app.models.user_model import UserModel
from app.repositories.user_repository import UserRepository
from app.schemas.requests.employee_request import EmployeeCreateRequest
from app.schemas.requests.login_request import LoginRequest
from scripts.seed_constants import (
    COUNTRY_PROFILES,
    EARLIEST_HIRE_DATE,
    FIRST_NAMES_FILE,
    JOB_PROFILES,
    LAST_NAMES_FILE,
    LATEST_HIRE_DATE,
    SALARY_ROUNDING,
    SEED_EMAIL_DOMAIN,
    SEED_EMPLOYEE_COUNT,
    SEED_RANDOM_SEED,
    JobProfile,
)


def read_names(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [name for line in lines if (name := line.strip())]


def unique_email(first_name: str, last_name: str, taken: dict[str, int]) -> str:
    """asha.rao@, then asha.rao2@, asha.rao3@ ... for people who share a name."""
    local_part = f"{first_name}.{last_name}".lower()
    taken[local_part] = taken.get(local_part, 0) + 1
    suffix = "" if taken[local_part] == 1 else str(taken[local_part])
    return f"{local_part}{suffix}@{SEED_EMAIL_DOMAIN}"


def random_salary(rng: random.Random, job: JobProfile, country: Country) -> Decimal:
    usd = rng.randint(job.min_salary, job.max_salary) * COUNTRY_PROFILES[country].pay_factor
    # The default rates, not the configured ones, so the seed is the same on every machine.
    local = usd * DEFAULT_EXCHANGE_RATES[currency_of(country)]
    # Rounding down keeps the salary inside the scaled range.
    rounded = (local // SALARY_ROUNDING) * SALARY_ROUNDING
    return Decimal(rounded).quantize(Decimal("0.01"))


def random_hire_date(rng: random.Random) -> date:
    days = (LATEST_HIRE_DATE - EARLIEST_HIRE_DATE).days
    return EARLIEST_HIRE_DATE + timedelta(days=rng.randint(0, days))


def build_employees(count: int, random_seed: int) -> list[EmployeeCreateRequest]:
    """Every employee goes through the API's own request schema, so seed data is valid data."""
    rng = random.Random(random_seed)
    first_names = read_names(FIRST_NAMES_FILE)
    last_names = read_names(LAST_NAMES_FILE)
    job_titles = list(JOB_PROFILES)
    job_weights = [job.weight for job in JOB_PROFILES.values()]
    countries = list(COUNTRY_PROFILES)
    country_weights = [country.weight for country in COUNTRY_PROFILES.values()]
    taken_emails: dict[str, int] = {}

    employees = []
    for _ in range(count):
        first_name, last_name = rng.choice(first_names), rng.choice(last_names)
        [job_title] = rng.choices(job_titles, weights=job_weights)
        [country] = rng.choices(countries, weights=country_weights)
        job = JOB_PROFILES[job_title]
        employees.append(
            EmployeeCreateRequest(
                full_name=f"{first_name} {last_name}",
                email=unique_email(first_name, last_name, taken_emails),
                job_title=job_title,
                department=job.department,
                country=country,
                salary=random_salary(rng, job, country),
                hire_date=random_hire_date(rng),
            )
        )
    return employees


def seed_employees(session: Session, count: int, random_seed: int) -> int:
    """Inserts the employees in one bulk insert. Returns how many, or 0 if the table had rows."""
    if session.scalar(select(func.count()).select_from(EmployeeModel)):
        return 0
    rows = [employee.model_dump() for employee in build_employees(count, random_seed)]
    session.execute(insert(EmployeeModel), rows)
    session.commit()
    return len(rows)


def run_seed(settings: Settings, count: int = SEED_EMPLOYEE_COUNT) -> int:
    engine = create_database_engine(settings.database_url)
    try:
        with create_session_factory(engine)() as session:
            return seed_employees(session, count, SEED_RANDOM_SEED)
    finally:
        engine.dispose()


class HrManagerSeedOutcome(Enum):
    CREATED = "HR manager created"
    ALREADY_EXISTS = "HR manager already exists; seed skipped"
    NOT_CONFIGURED = "HR manager not created: set HR_MANAGER_EMAIL and HR_MANAGER_PASSWORD"


def seed_hr_manager(session: Session, email: str, password: str) -> HrManagerSeedOutcome:
    """Creates the one HR manager. An existing one keeps their password, so re-seeding is safe."""
    # The login schema, so the stored email is normalised exactly as login looks it up.
    credentials = LoginRequest.model_validate({"email": email, "password": password})
    users = UserRepository(session)
    if users.find_by_email(credentials.email):
        return HrManagerSeedOutcome.ALREADY_EXISTS
    users.add(UserModel(email=credentials.email, password_hash=hash_password(password)))
    session.commit()
    return HrManagerSeedOutcome.CREATED


def run_hr_manager_seed(settings: Settings) -> HrManagerSeedOutcome:
    if not settings.hr_manager_email or not settings.hr_manager_password:
        return HrManagerSeedOutcome.NOT_CONFIGURED
    engine = create_database_engine(settings.database_url)
    try:
        with create_session_factory(engine)() as session:
            return seed_hr_manager(
                session, settings.hr_manager_email, settings.hr_manager_password.get_secret_value()
            )
    finally:
        engine.dispose()


def main() -> None:
    settings = get_settings()
    started = time.perf_counter()
    inserted = run_seed(settings, SEED_EMPLOYEE_COUNT)
    elapsed = time.perf_counter() - started
    # Counts and timings only: seed data looks like personal data, so none of it is printed,
    # and neither are the HR manager's email and password.
    if inserted:
        print(f"Seeded {inserted} employees in {elapsed:.2f}s")
    else:
        print("Employees already exist; seed skipped")
    print(run_hr_manager_seed(settings).value)


if __name__ == "__main__":
    main()
