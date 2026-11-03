"""Seeds the database with 10,000 employees, the same ones on every run.

Run from api/: `uv run python -m scripts.seed` (after `uv run alembic upgrade head`).
"""

import random
import time
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, insert, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import create_database_engine, create_session_factory
from app.models.employee_model import EmployeeModel
from app.schemas.requests.employee_request import EmployeeCreateRequest
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


def random_salary(rng: random.Random, job: JobProfile, pay_factor: Decimal) -> Decimal:
    base = rng.randint(job.min_salary, job.max_salary) * pay_factor
    # Rounding down keeps the salary inside the scaled range.
    rounded = (base // SALARY_ROUNDING) * SALARY_ROUNDING
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
                salary=random_salary(rng, job, COUNTRY_PROFILES[country].pay_factor),
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


def main() -> None:
    started = time.perf_counter()
    inserted = run_seed(get_settings(), SEED_EMPLOYEE_COUNT)
    elapsed = time.perf_counter() - started
    # Counts and timings only: seed data looks like personal data, so none of it is printed.
    if inserted:
        print(f"Seeded {inserted} employees in {elapsed:.2f}s")
    else:
        print("Employees already exist; seed skipped")


if __name__ == "__main__":
    main()
