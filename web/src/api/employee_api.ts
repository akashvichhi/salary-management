import { apiClient } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import type { IApiResponse } from '@src/types/api_response'
import type { IEmployee, IEmployeeCreatePayload, IEmployeeListParams, TEmployeeUpdatePayload } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'

export async function getEmployees(params: IEmployeeListParams): Promise<IPaginatedResponse<IEmployee>> {
  const { data } = await apiClient.get<IPaginatedResponse<IEmployee>>(API_ENDPOINTS.employees, { params })
  return data
}

export async function createEmployee(payload: IEmployeeCreatePayload): Promise<IEmployee> {
  const { data } = await apiClient.post<IApiResponse<IEmployee>>(API_ENDPOINTS.employees, payload)
  return data.data
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.employeeById(id))
}

export async function updateEmployee(id: number, payload: TEmployeeUpdatePayload): Promise<IEmployee> {
  const { data } = await apiClient.patch<IApiResponse<IEmployee>>(API_ENDPOINTS.employeeById(id), payload)
  return data.data
}
