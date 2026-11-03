from fastapi import FastAPI

APP_TITLE = "Salary Management API"


def create_app() -> FastAPI:
    return FastAPI(title=APP_TITLE)


app = create_app()
