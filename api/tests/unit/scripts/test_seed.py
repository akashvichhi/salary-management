from decimal import Decimal

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants.employee_constants import Country, JobTitle
from app.core.config import Settings
from app.core.database import create_database_engine, create_session_factory
from app.models.employee_model import EmployeeModel
from app.schemas.requests.employee_request import EmployeeCreateRequest
from scripts import seed
from scripts.seed import build_employees, run_seed, seed_employees, unique_email
from scripts.seed_constants import COUNTRY_PROFILES, JOB_PROFILES
from tests.factories import build_employee

SMALL_SEED_COUNT = 300
TEST_RANDOM_SEED = 7


def employee_count(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(EmployeeModel)) or 0


def test_the_same_seed_builds_identical_employees() -> None:
    first = build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED)
    second = build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED)

    assert first == second


def test_a_different_seed_builds_different_employees() -> None:
    assert build_employees(SMALL_SEED_COUNT, 1) != build_employees(SMALL_SEED_COUNT, 2)


def test_seeded_emails_are_unique() -> None:
    employees = build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED)

    assert len({employee.email for employee in employees}) == SMALL_SEED_COUNT


def test_a_repeated_name_gets_a_numbered_email() -> None:
    taken: dict[str, int] = {}

    emails = [unique_email("Asha", "Rao", taken) for _ in range(3)]

    assert emails == ["asha.rao@example.com", "asha.rao2@example.com", "asha.rao3@example.com"]


def test_every_seeded_employee_passes_the_api_validation() -> None:
    for employee in build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED):
        # Round-trip through JSON, exactly as a POST /employees body would arrive.
        assert EmployeeCreateRequest.model_validate(employee.model_dump(mode="json")) == employee


def test_department_and_salary_follow_the_job_title_and_country() -> None:
    for employee in build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED):
        job = JOB_PROFILES[employee.job_title]
        pay_factor = COUNTRY_PROFILES[employee.country].pay_factor

        assert employee.department == job.department
        assert job.min_salary * pay_factor <= employee.salary <= job.max_salary * pay_factor
        assert employee.salary % 100 == 0


def test_every_job_title_and_country_has_a_profile() -> None:
    assert set(JOB_PROFILES) == set(JobTitle)
    assert set(COUNTRY_PROFILES) == set(Country)
    assert all(job.min_salary < job.max_salary for job in JOB_PROFILES.values())
    assert all(country.pay_factor > Decimal(0) for country in COUNTRY_PROFILES.values())


def test_seed_inserts_the_employees(session: Session) -> None:
    inserted = seed_employees(session, count=SMALL_SEED_COUNT, random_seed=TEST_RANDOM_SEED)

    assert inserted == SMALL_SEED_COUNT
    assert employee_count(session) == SMALL_SEED_COUNT


def test_seed_is_skipped_when_employees_already_exist(session: Session) -> None:
    session.add(build_employee())
    session.commit()

    inserted = seed_employees(session, count=SMALL_SEED_COUNT, random_seed=TEST_RANDOM_SEED)

    assert inserted == 0
    assert employee_count(session) == 1


def test_run_seed_seeds_the_configured_database_once(settings: Settings) -> None:
    assert run_seed(settings, count=SMALL_SEED_COUNT) == SMALL_SEED_COUNT
    assert run_seed(settings, count=SMALL_SEED_COUNT) == 0

    engine = create_database_engine(settings.database_url)
    with create_session_factory(engine)() as session:
        assert employee_count(session) == SMALL_SEED_COUNT
    engine.dispose()


def test_main_reports_only_counts_and_time(
    settings: Settings, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(seed, "get_settings", lambda: settings)
    monkeypatch.setattr(seed, "SEED_EMPLOYEE_COUNT", SMALL_SEED_COUNT)

    seed.main()
    seed.main()

    first_run, second_run = capsys.readouterr().out.splitlines()
    assert first_run.startswith(f"Seeded {SMALL_SEED_COUNT} employees in ")
    assert second_run == "Employees already exist; seed skipped"
