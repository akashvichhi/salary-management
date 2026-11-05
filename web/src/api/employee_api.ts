import { apiClient } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import type { IEmployee, IEmployeeListParams } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'

export async function getEmployees(params: IEmployeeListParams): Promise<IPaginatedResponse<IEmployee>> {
  const { data } = await apiClient.get<IPaginatedResponse<IEmployee>>(API_ENDPOINTS.employees, { params })
  return data
}
