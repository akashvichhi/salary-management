import pytest
from pydantic import ValidationError

from app.constants.pagination_constants import DEFAULT_PAGE, DEFAULT_PER_PAGE, MAX_PER_PAGE
from app.schemas.requests.pagination_request import PaginationRequest


def test_pagination_defaults_to_the_first_page_of_default_size() -> None:
    pagination = PaginationRequest()

    assert pagination.page == DEFAULT_PAGE
    assert pagination.per_page == DEFAULT_PER_PAGE


def test_offset_of_the_first_page_is_zero() -> None:
    assert PaginationRequest(page=1, per_page=20).offset == 0


def test_offset_skips_the_rows_of_earlier_pages() -> None:
    assert PaginationRequest(page=3, per_page=20).offset == 40


@pytest.mark.parametrize("page", [0, -1])
def test_page_below_one_is_rejected(page: int) -> None:
    with pytest.raises(ValidationError):
        PaginationRequest(page=page)


@pytest.mark.parametrize("per_page", [0, MAX_PER_PAGE + 1])
def test_per_page_outside_the_allowed_range_is_rejected(per_page: int) -> None:
    with pytest.raises(ValidationError):
        PaginationRequest(per_page=per_page)
