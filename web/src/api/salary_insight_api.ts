import { apiClient } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import type { IApiResponse } from '@src/types/api_response'
import type {
  ICountrySalaryInsight,
  IDepartmentSalaryInsight,
  IJobTitleSalaryInsight,
  IPayrollOverview,
} from '@src/types/salary_insight'

export async function getPayrollOverview(): Promise<IPayrollOverview> {
  const { data } = await apiClient.get<IApiResponse<IPayrollOverview>>(API_ENDPOINTS.payrollOverview)
  return data.data
}

export async function getSalaryByCountry(): Promise<ICountrySalaryInsight[]> {
  const { data } = await apiClient.get<IApiResponse<ICountrySalaryInsight[]>>(API_ENDPOINTS.salaryByCountry)
  return data.data
}

export async function getSalaryByJobTitle(country: string): Promise<IJobTitleSalaryInsight[]> {
  const { data } = await apiClient.get<IApiResponse<IJobTitleSalaryInsight[]>>(API_ENDPOINTS.salaryByJobTitle, {
    params: { country },
  })
  return data.data
}

export async function getSalaryByDepartment(): Promise<IDepartmentSalaryInsight[]> {
  const { data } = await apiClient.get<IApiResponse<IDepartmentSalaryInsight[]>>(API_ENDPOINTS.salaryByDepartment)
  return data.data
}
