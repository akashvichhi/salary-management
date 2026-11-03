from app.main import APP_TITLE, create_app


def test_create_app_returns_the_salary_management_api() -> None:
    app = create_app()

    assert app.title == APP_TITLE
