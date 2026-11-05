import { apiClient } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import type { IApiResponse } from '@src/types/api_response'
import type { ILoginFormValues, IUser } from '@src/types/auth'

// The session itself travels only in the httpOnly cookie: no function here ever sees it.
export async function login(credentials: ILoginFormValues): Promise<IUser> {
  const response: { data: IApiResponse<IUser> } = await apiClient.post(API_ENDPOINTS.login, credentials)
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.logout)
}

export async function getCurrentUser(): Promise<IUser> {
  const response: { data: IApiResponse<IUser> } = await apiClient.get(API_ENDPOINTS.currentUser)
  return response.data.data
}
