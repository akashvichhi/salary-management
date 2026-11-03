from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.constants.health_constants import HEALTH_PATH, HEALTH_STATUS_OK
from app.core.database import check_database_connection, get_db
from app.schemas.common.response_schema import DataResponse
from app.schemas.resources.health_resource import HealthResource

# Mounted outside /api/v1: Render's health check must not change with API versions.
health_router = APIRouter(tags=["health"])


@health_router.get(HEALTH_PATH, response_model=DataResponse[HealthResource])
def get_health(session: Annotated[Session, Depends(get_db)]) -> DataResponse[HealthResource]:
    check_database_connection(session)
    return DataResponse(data=HealthResource(status=HEALTH_STATUS_OK))
