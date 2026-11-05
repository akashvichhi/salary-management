import { useEffect, useMemo } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import {
  COUNTRY_CODES,
  DEFAULT_EMPLOYEE_SORT,
  DEFAULT_PER_PAGE,
  DEPARTMENTS,
  EMPLOYEE_SORT_FIELDS,
  JOB_TITLES,
  PER_PAGE_OPTIONS,
} from '@src/constants/employee_constants'
import { useListUrlState } from '@src/hooks/use_list_url_state'
import type { IListUrlConfig, IListUrlState } from '@src/hooks/use_list_url_state'
import { useEmployeesQuery } from '@src/queries/employee_queries'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee, IEmployeeListParams, TEmployeeFilterKey } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'

interface IEmployeeList {
  listState:      IListUrlState<TEmployeeFilterKey>
  employeesQuery: UseQueryResult<IPaginatedResponse<IEmployee>, IApiError>
}

const EMPLOYEE_LIST_URL_CONFIG: IListUrlConfig<TEmployeeFilterKey> = {
  filters: {
    country:    COUNTRY_CODES,
    jobTitle:   JOB_TITLES,
    department: DEPARTMENTS,
  },
  sortFields:     Object.values(EMPLOYEE_SORT_FIELDS),
  defaultSort:    DEFAULT_EMPLOYEE_SORT,
  perPageOptions: PER_PAGE_OPTIONS,
  defaultPerPage: DEFAULT_PER_PAGE,
}

export function useEmployeeList(): IEmployeeList {
  const listState: IListUrlState<TEmployeeFilterKey> = useListUrlState(EMPLOYEE_LIST_URL_CONFIG)
  const { page, perPage, search, sort, filters, setPage } = listState

  const params: IEmployeeListParams = useMemo<IEmployeeListParams>((): IEmployeeListParams => ({
    page,
    perPage,
    sort,
    search:     search || undefined,
    country:    filters.country ?? undefined,
    jobTitle:   filters.jobTitle ?? undefined,
    department: filters.department ?? undefined,
  }), [page, perPage, sort, search, filters])

  const employeesQuery: UseQueryResult<IPaginatedResponse<IEmployee>, IApiError> = useEmployeesQuery(params)
  const { data } = employeesQuery

  // A page past the end (e.g. its last row was deleted, or an old link) steps back to the last
  // page. It replaces the history entry, so "back" doesn't return to the empty page.
  useEffect((): void => {
    if (!data || data.data.length > 0) return
    const { totalPages } = data.meta
    if (totalPages > 0 && page > totalPages) setPage(totalPages, { replace: true })
  }, [data, page, setPage])

  return { listState, employeesQuery }
}
