from decimal import Decimal

import pytest
from pydantic import SecretStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants.currency_constants import DEFAULT_EXCHANGE_RATES
from app.constants.employee_constants import Country, JobTitle
from app.core.config import Settings
from app.core.currency_converter import currency_of
from app.core.database import create_database_engine, create_session_factory
from app.core.security import verify_password
from app.models.employee_model import EmployeeModel
from app.models.user_model import UserModel
from app.schemas.requests.employee_request import EmployeeCreateRequest
from scripts import seed
from scripts.seed import build_employees, run_seed, seed_employees, unique_email
from scripts.seed_constants import COUNTRY_PROFILES, JOB_PROFILES, SALARY_ROUNDING
from tests.factories import HR_MANAGER_EMAIL, HR_MANAGER_PASSWORD, build_employee, build_user

SMALL_SEED_COUNT = 300
HR_MANAGER_NOT_CONFIGURED_LINE = (
    "HR manager not created: set HR_MANAGER_EMAIL and HR_MANAGER_PASSWORD"
)
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
        # The USD range, scaled by the country's pay factor, in the country's own currency.
        scale = (
            COUNTRY_PROFILES[employee.country].pay_factor
            * DEFAULT_EXCHANGE_RATES[currency_of(employee.country)]
        )

        assert employee.department == job.department
        # Rounding down to a whole SALARY_ROUNDING can take a salary just below the range.
        assert job.min_salary * scale - SALARY_ROUNDING < employee.salary
        assert employee.salary <= job.max_salary * scale
        assert employee.salary % SALARY_ROUNDING == 0


def test_seeded_salaries_are_in_local_currency() -> None:
    employees = build_employees(SMALL_SEED_COUNT, TEST_RANDOM_SEED)
    lowest_indian_salary = min(e.salary for e in employees if e.country == Country.INDIA)
    highest_us_salary = max(e.salary for e in employees if e.country == Country.UNITED_STATES)

    # Rupees: even the lowest Indian salary is a larger number than any US salary in dollars.
    assert lowest_indian_salary > highest_us_salary


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

    first_employees, first_manager, second_employees, second_manager = (
        capsys.readouterr().out.splitlines()
    )
    assert first_employees.startswith(f"Seeded {SMALL_SEED_COUNT} employees in ")
    assert second_employees == "Employees already exist; seed skipped"
    assert first_manager == second_manager == HR_MANAGER_NOT_CONFIGURED_LINE


def users(session: Session) -> list[UserModel]:
    return list(session.scalars(select(UserModel)))


def with_hr_manager(settings: Settings, email: str | None, password: str | None) -> Settings:
    secret = SecretStr(password) if password is not None else None
    return settings.model_copy(update={"hr_manager_email": email, "hr_manager_password": secret})


def test_seed_creates_the_hr_manager_with_a_hashed_password(session: Session) -> None:
    outcome = seed.seed_hr_manager(session, " HR@Acme.com ", HR_MANAGER_PASSWORD)

    assert outcome is seed.HrManagerSeedOutcome.CREATED
    [user] = users(session)
    assert user.email == HR_MANAGER_EMAIL
    assert user.password_hash != HR_MANAGER_PASSWORD
    assert verify_password(user.password_hash, HR_MANAGER_PASSWORD)


def test_seed_keeps_an_existing_hr_manager_and_their_password(session: Session) -> None:
    session.add(build_user())
    session.commit()

    outcome = seed.seed_hr_manager(session, HR_MANAGER_EMAIL, "a new password")

    assert outcome is seed.HrManagerSeedOutcome.ALREADY_EXISTS
    [user] = users(session)
    assert verify_password(user.password_hash, HR_MANAGER_PASSWORD)


@pytest.mark.parametrize(
    ("email", "password"), [(None, None), (HR_MANAGER_EMAIL, None), (None, HR_MANAGER_PASSWORD)]
)
def test_the_hr_manager_is_not_created_without_both_credentials(
    settings: Settings, email: str | None, password: str | None
) -> None:
    outcome = seed.run_hr_manager_seed(with_hr_manager(settings, email, password))

    assert outcome is seed.HrManagerSeedOutcome.NOT_CONFIGURED


def test_main_creates_the_hr_manager_from_the_environment_without_printing_it(
    settings: Settings, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    configured = with_hr_manager(settings, HR_MANAGER_EMAIL, HR_MANAGER_PASSWORD)
    monkeypatch.setattr(seed, "get_settings", lambda: configured)
    monkeypatch.setattr(seed, "SEED_EMPLOYEE_COUNT", SMALL_SEED_COUNT)

    seed.main()
    seed.main()

    output = capsys.readouterr().out
    assert output.splitlines()[1] == "HR manager created"
    assert output.splitlines()[3] == "HR manager already exists; seed skipped"
    assert HR_MANAGER_EMAIL not in output
    assert HR_MANAGER_PASSWORD not in output
