from fastapi import APIRouter

from app.api.dependencies import SalaryInsightServiceDependency
from app.constants.route_constants import SALARY_BY_COUNTRY_PATH, SALARY_INSIGHTS_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.resources.salary_insight_resource import CountrySalaryInsightResource

salary_insight_router = APIRouter(prefix=SALARY_INSIGHTS_PATH, tags=["salary insights"])


@salary_insight_router.get(
    SALARY_BY_COUNTRY_PATH, response_model=DataResponse[list[CountrySalaryInsightResource]]
)
def salary_by_country(
    service: SalaryInsightServiceDependency,
) -> DataResponse[list[CountrySalaryInsightResource]]:
    return DataResponse(data=service.salary_by_country())
