import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { API_URL } from '@src/config/env'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'
import { HTTP_UNAUTHORIZED } from '@src/constants/http_status'
import type { IApiError, IFieldError } from '@src/types/api_response'
import { keysToCamelCase, keysToSnakeCase, toCamelCase } from '@src/utils/case_converter'

type TSessionExpiredHandler = () => void

// withCredentials sends the httpOnly session cookie, also to the API on another port in development.
export const apiClient: AxiosInstance = axios.create({ baseURL: API_URL, withCredentials: true })

// These answer 401 as part of their job ("not logged in yet", "wrong password"), not because a
// session expired.
const SESSION_CHECK_ENDPOINTS: readonly string[] = [API_ENDPOINTS.currentUser, API_ENDPOINTS.login]

let sessionExpiredHandler: TSessionExpiredHandler | null = null

// Set once by the app (clear the cache, back to login), so this file needs no router or cache.
export function setSessionExpiredHandler(handler: TSessionExpiredHandler | null): void {
  sessionExpiredHandler = handler
}

function convertRequestKeys(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  config.data = keysToSnakeCase(config.data)
  config.params = keysToSnakeCase(config.params)
  return config
}

function convertResponseKeys(response: AxiosResponse): AxiosResponse {
  response.data = keysToCamelCase(response.data)
  return response
}

function isFieldError(value: unknown): value is IFieldError {
  if (typeof value !== 'object' || value === null) return false
  const candidate: Partial<Record<keyof IFieldError, unknown>> = value
  return typeof candidate.field === 'string' && typeof candidate.message === 'string'
}

function isApiErrorBody(value: unknown): value is IApiError {
  if (typeof value !== 'object' || value === null) return false
  const candidate: Partial<Record<keyof IApiError, unknown>> = value
  if (typeof candidate.error !== 'string') return false
  return candidate.details === undefined
    || (Array.isArray(candidate.details) && candidate.details.every(isFieldError))
}

// details[].field is a field name sent as a value, so it is the one value that gets converted:
// the form inputs are named in camelCase.
function toApiError(error: AxiosError): IApiError {
  if (!error.response) return { error: NETWORK_ERROR_MESSAGE }

  const { status } = error.response
  const body: unknown = error.response.data
  if (!isApiErrorBody(body)) return { error: UNEXPECTED_ERROR_MESSAGE, status }
  if (!body.details) return { error: body.error, status }

  return {
    error:   body.error,
    details: body.details.map((detail: IFieldError): IFieldError => ({ ...detail, field: toCamelCase(detail.field) })),
    status,
  }
}

function reportExpiredSession(error: AxiosError): void {
  if (error.response?.status !== HTTP_UNAUTHORIZED) return
  if (SESSION_CHECK_ENDPOINTS.includes(error.config?.url ?? '')) return
  sessionExpiredHandler?.()
}

function rejectWithApiError(error: AxiosError): Promise<never> {
  reportExpiredSession(error)
  return Promise.reject(toApiError(error))
}

apiClient.interceptors.request.use(convertRequestKeys)
apiClient.interceptors.response.use(convertResponseKeys, rejectWithApiError)
