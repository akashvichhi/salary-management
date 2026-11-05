import { useMemo, useState } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@src/constants/employee_constants'
import { useEmployeesQuery } from '@src/queries/employee_queries'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse, IPaginationParams } from '@src/types/pagination'

interface IEmployeeList {
  page:           number
  setPage:        (page: number) => void
  employeesQuery: UseQueryResult<IPaginatedResponse<IEmployee>, IApiError>
}

export function useEmployeeList(): IEmployeeList {
  const [page, setPage] = useState<number>(DEFAULT_PAGE)
  const params: IPaginationParams = useMemo<IPaginationParams>(
    (): IPaginationParams => ({ page, perPage: DEFAULT_PER_PAGE }),
    [page],
  )

  return { page, setPage, employeesQuery: useEmployeesQuery(params) }
}
