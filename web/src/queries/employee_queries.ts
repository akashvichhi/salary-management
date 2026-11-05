import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { getEmployees } from '@src/api/employee_api'
import { employeeKeys } from '@src/constants/query_keys'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse, IPaginationParams } from '@src/types/pagination'

export function useEmployeesQuery(
  params: IPaginationParams,
): UseQueryResult<IPaginatedResponse<IEmployee>, IApiError> {
  return useQuery<IPaginatedResponse<IEmployee>, IApiError>({
    queryKey:        employeeKeys.list(params),
    queryFn:         (): Promise<IPaginatedResponse<IEmployee>> => getEmployees(params),
    // The table keeps the current rows while the next page loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  })
}
