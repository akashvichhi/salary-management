import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import {
  getPayrollOverview,
  getSalaryByCountry,
  getSalaryByDepartment,
  getSalaryByJobTitle,
} from '@src/api/salary_insight_api'
import { salaryInsightKeys } from '@src/constants/query_keys'
import type { IApiError } from '@src/types/api_response'
import type {
  ICountrySalaryInsight,
  IDepartmentSalaryInsight,
  IJobTitleSalaryInsight,
  IPayrollOverview,
} from '@src/types/salary_insight'

export function usePayrollOverviewQuery(): UseQueryResult<IPayrollOverview, IApiError> {
  return useQuery<IPayrollOverview, IApiError>({
    queryKey: salaryInsightKeys.overview(),
    queryFn:  (): Promise<IPayrollOverview> => getPayrollOverview(),
  })
}

export function useSalaryByCountryQuery(): UseQueryResult<ICountrySalaryInsight[], IApiError> {
  return useQuery<ICountrySalaryInsight[], IApiError>({
    queryKey: salaryInsightKeys.byCountry(),
    queryFn:  (): Promise<ICountrySalaryInsight[]> => getSalaryByCountry(),
  })
}

// Waits for a country: the API compares job titles within one country only.
export function useSalaryByJobTitleQuery(country: string | null): UseQueryResult<IJobTitleSalaryInsight[], IApiError> {
  return useQuery<IJobTitleSalaryInsight[], IApiError>({
    queryKey: salaryInsightKeys.byJobTitle(country ?? ''),
    queryFn:  (): Promise<IJobTitleSalaryInsight[]> => getSalaryByJobTitle(country ?? ''),
    enabled:  country !== null,
  })
}

export function useSalaryByDepartmentQuery(): UseQueryResult<IDepartmentSalaryInsight[], IApiError> {
  return useQuery<IDepartmentSalaryInsight[], IApiError>({
    queryKey: salaryInsightKeys.byDepartment(),
    queryFn:  (): Promise<IDepartmentSalaryInsight[]> => getSalaryByDepartment(),
  })
}
