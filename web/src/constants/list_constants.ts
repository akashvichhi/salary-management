// Shared by every paginated, sortable list (the URL state and the sortable column headers).
export const DEFAULT_PAGE: number = 1
// The API's MAX_PAGE (api/app/constants/pagination_constants.py). A higher page from the URL is
// capped to it, so the request succeeds and the empty result steps back to the last page.
export const MAX_PAGE: number = 1_000_000
// "-salary" sorts by salary, descending: the API's sort syntax.
export const DESCENDING_PREFIX: string = '-'
