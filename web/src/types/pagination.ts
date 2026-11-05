export interface IPaginationMeta {
  totalCount:  number
  currentPage: number
  perPage:     number
  totalPages:  number
}

export interface IPaginatedResponse<T> {
  data: T[]
  meta: IPaginationMeta
}

export interface IPaginationParams {
  page:    number
  perPage: number
}
