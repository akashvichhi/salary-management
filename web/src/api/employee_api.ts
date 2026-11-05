import { apiClient } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse, IPaginationParams } from '@src/types/pagination'

export async function getEmployees(params: IPaginationParams): Promise<IPaginatedResponse<IEmployee>> {
  const { data } = await apiClient.get<IPaginatedResponse<IEmployee>>(API_ENDPOINTS.employees, { params })
  return data
}
