from app.constants.employee_constants import Country, Department, JobTitle
from app.services.employee_option_service import EmployeeOptionService


def test_every_country_has_a_display_name() -> None:
    countries = EmployeeOptionService().get_options().countries

    assert [country.code for country in countries] == list(Country)
    assert all(country.name for country in countries)


def test_departments_and_job_titles_keep_the_order_of_their_lists() -> None:
    options = EmployeeOptionService().get_options()

    assert options.departments == list(Department)
    assert options.job_titles == list(JobTitle)
