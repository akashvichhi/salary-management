from app.schemas.common.response_schema import PaginatedResponse
from app.schemas.requests.pagination_request import PaginationRequest


def test_paginated_response_with_no_results_has_zero_pages() -> None:
    response = PaginatedResponse[str].create([], 0, PaginationRequest(page=1, per_page=20))

    assert response.data == []
    assert response.meta.total_count == 0
    assert response.meta.total_pages == 0


def test_paginated_response_rounds_a_partial_last_page_up() -> None:
    response = PaginatedResponse[str].create(["a"], 41, PaginationRequest(page=3, per_page=20))

    assert response.meta.total_pages == 3
    assert response.meta.current_page == 3
    assert response.meta.per_page == 20


def test_paginated_response_beyond_the_last_page_keeps_the_real_meta() -> None:
    response = PaginatedResponse[str].create([], 41, PaginationRequest(page=9, per_page=20))

    assert response.data == []
    assert response.meta.total_count == 41
    assert response.meta.total_pages == 3
    assert response.meta.current_page == 9
