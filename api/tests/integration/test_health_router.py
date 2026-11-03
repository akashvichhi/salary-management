from fastapi.testclient import TestClient

HEALTH_URL = "/api/health"


def test_health_check_reports_ok_when_the_database_responds(client: TestClient) -> None:
    response = client.get(HEALTH_URL)

    assert response.status_code == 200
    assert response.json() == {"data": {"status": "ok"}}
