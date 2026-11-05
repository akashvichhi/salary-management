import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { createEmployee, deleteEmployee, getEmployeeOptions, getEmployees, updateEmployee } from '@src/api/employee_api'
import { EMPLOYEE_CREATED_MESSAGE, EMPLOYEE_DELETED_MESSAGE, EMPLOYEE_UPDATED_MESSAGE } from '@src/constants/employee_messages'
import { employeeKeys, salaryInsightKeys } from '@src/constants/query_keys'
import type { IApiError } from '@src/types/api_response'
import type {
  ICountryOption,
  IEmployee,
  IEmployeeCreatePayload,
  IEmployeeListParams,
  IEmployeeOptions,
  IEmployeeSelectOptions,
  ISelectOption,
  TEmployeeUpdatePayload,
} from '@src/types/employee'
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

function toSelectOptions(options: IEmployeeOptions): IEmployeeSelectOptions {
  return {
    countries:         options.countries.map(({ code, name }: ICountryOption): ISelectOption => ({ value: code, label: name })),
    departments:       options.departments,
    jobTitles:         options.jobTitles,
    countryCodes:      options.countries.map(({ code }: ICountryOption): string => code),
    countryNameByCode: new Map(options.countries.map(({ code, name }: ICountryOption): [string, string] => [code, name])),
  }
}

// The lists are fixed in the API's code, so they only change with a deploy, which reloads the app:
// they are loaded once per visit and never refetched.
export function useEmployeeOptionsQuery(): UseQueryResult<IEmployeeSelectOptions, IApiError> {
  return useQuery<IEmployeeOptions, IApiError, IEmployeeSelectOptions>({
    queryKey:  employeeKeys.options(),
    queryFn:   (): Promise<IEmployeeOptions> => getEmployeeOptions(),
    select:    toSelectOptions,
    staleTime: Infinity,
  })
}

function showMutationError(error: IApiError): void {
  showErrorNotification(error.error)
}

// Every insight is computed from the employees, so a change makes them out of date along with the
// lists. Insights not on screen are refetched when the page opens again.
function refreshEmployeeData(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: salaryInsightKeys.all() }),
  ]).then((): void => undefined)
}

export function useCreateEmployeeMutation(): UseMutationResult<IEmployee, IApiError, IEmployeeCreatePayload> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<IEmployee, IApiError, IEmployeeCreatePayload>({
    mutationFn: (payload: IEmployeeCreatePayload): Promise<IEmployee> => createEmployee(payload),
    onSuccess:  async (): Promise<void> => {
      showSuccessNotification(EMPLOYEE_CREATED_MESSAGE)
      await refreshEmployeeData(queryClient)
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
      await refreshEmployeeData(queryClient)
    },
    onError: showMutationError,
  })
}

// Reloading the list also covers deleting the last row of the last page: the empty page that comes
// back makes the list step back a page (use_employee_list.ts).
export function useDeleteEmployeeMutation(): UseMutationResult<void, IApiError, number> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<void, IApiError, number>({
    mutationFn: (id: number): Promise<void> => deleteEmployee(id),
    onSuccess:  async (): Promise<void> => {
      showSuccessNotification(EMPLOYEE_DELETED_MESSAGE)
      await refreshEmployeeData(queryClient)
    },
    onError: showMutationError,
  })
}
