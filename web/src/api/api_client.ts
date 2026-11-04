import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { API_URL } from '@src/config/env'
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'
import type { IApiError, IFieldError } from '@src/types/api_response'
import { keysToCamelCase, keysToSnakeCase, toCamelCase } from '@src/utils/case_converter'

export const apiClient: AxiosInstance = axios.create({ baseURL: API_URL })

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

  const body: unknown = error.response.data
  if (!isApiErrorBody(body)) return { error: UNEXPECTED_ERROR_MESSAGE }
  if (!body.details) return { error: body.error }

  return {
    error:   body.error,
    details: body.details.map((detail: IFieldError): IFieldError => ({ ...detail, field: toCamelCase(detail.field) })),
  }
}

function rejectWithApiError(error: AxiosError): Promise<never> {
  return Promise.reject(toApiError(error))
}

apiClient.interceptors.request.use(convertRequestKeys)
apiClient.interceptors.response.use(convertResponseKeys, rejectWithApiError)
