from fastapi.testclient import TestClient

EMPLOYEE_OPTIONS_URL = "/api/v1/employee-options"


def test_employee_options_list_every_allowed_value_for_the_dropdowns(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.get(EMPLOYEE_OPTIONS_URL)

    assert response.status_code == 200
    options = response.json()["data"]
    assert options["countries"][:2] == [
        {"code": "AU", "name": "Australia", "currency": "AUD"},
        {"code": "CA", "name": "Canada", "currency": "CAD"},
    ]
    assert len(options["countries"]) == 10
    assert options["departments"][:2] == ["Customer Support", "Design"]
    assert len(options["departments"]) == 10
    assert options["job_titles"][:2] == ["Account Manager", "Accountant"]
    assert len(options["job_titles"]) == 20
