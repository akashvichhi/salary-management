import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { createEmployee, getEmployees, updateEmployee } from '@src/api/employee_api'
import { EMPLOYEE_CREATED_MESSAGE, EMPLOYEE_UPDATED_MESSAGE } from '@src/constants/employee_messages'
import { employeeKeys } from '@src/constants/query_keys'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee, IEmployeeCreatePayload, IEmployeeListParams, TEmployeeUpdatePayload } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'
import { showErrorNotification, showSuccessNotification } from '@src/utils/show_notification'

export interface IUpdateEmployeeVariables {
  id:      number
  payload: TEmployeeUpdatePayload
}

export function useEmployeesQuery(
  params: IEmployeeListParams,
): UseQueryResult<IPaginatedResponse<IEmployee>, IApiError> {
  return useQuery<IPaginatedResponse<IEmployee>, IApiError>({
    queryKey:        employeeKeys.list(params),
    queryFn:         (): Promise<IPaginatedResponse<IEmployee>> => getEmployees(params),
    // The table keeps the current rows while the next page loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  })
}

function showMutationError(error: IApiError): void {
  showErrorNotification(error.error)
}

export function useCreateEmployeeMutation(): UseMutationResult<IEmployee, IApiError, IEmployeeCreatePayload> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<IEmployee, IApiError, IEmployeeCreatePayload>({
    mutationFn: (payload: IEmployeeCreatePayload): Promise<IEmployee> => createEmployee(payload),
    onSuccess:  async (): Promise<void> => {
      showSuccessNotification(EMPLOYEE_CREATED_MESSAGE)
      await queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
    onError: showMutationError,
  })
}

export function useUpdateEmployeeMutation(): UseMutationResult<IEmployee, IApiError, IUpdateEmployeeVariables> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<IEmployee, IApiError, IUpdateEmployeeVariables>({
    mutationFn: ({ id, payload }: IUpdateEmployeeVariables): Promise<IEmployee> => updateEmployee(id, payload),
    onSuccess:  async (): Promise<void> => {
      showSuccessNotification(EMPLOYEE_UPDATED_MESSAGE)
      await queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
    onError: showMutationError,
  })
}
