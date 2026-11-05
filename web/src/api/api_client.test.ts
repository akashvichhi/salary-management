import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient, setSessionExpiredHandler } from '@src/api/api_client'
import { API_ENDPOINTS } from '@src/constants/api_endpoints'
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'

const HTTP_OK: number = 200
const FIRST_ERROR_STATUS: number = 400
const HTTP_UNAUTHORIZED: number = 401
const HTTP_UNPROCESSABLE: number = 422
const HTTP_NOT_FOUND: number = 404
const HTTP_BAD_GATEWAY: number = 502

const originalAdapter: AxiosAdapter | undefined = apiClient.defaults.adapter as AxiosAdapter | undefined
let lastRequest: InternalAxiosRequestConfig | null = null

function buildResponse(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: '', headers: new AxiosHeaders(), config }
}

// Stands in for the network: records the request and answers like a real adapter would.
function respondWith(status: number, data: unknown): AxiosAdapter {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    lastRequest = config
    const response: AxiosResponse = buildResponse(config, status, data)
    if (status >= FIRST_ERROR_STATUS) {
      return Promise.reject(new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response))
    }
    return Promise.resolve(response)
  }
}

function failWithNetworkError(): AxiosAdapter {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config))
  }
}

beforeEach((): void => {
  lastRequest = null
})

afterEach((): void => {
  apiClient.defaults.adapter = originalAdapter
})

describe('apiClient requests', (): void => {
  it('sends the session cookie, also to the API on another port in development', (): void => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('converts request body keys to snake_case', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_OK, {})

    await apiClient.post('api/v1/employees', { fullName: 'Asha Rao', hireDate: '2026-10-31' })

    expect(JSON.parse(lastRequest?.data as string)).toEqual({ full_name: 'Asha Rao', hire_date: '2026-10-31' })
  })

  it('converts query param keys to snake_case and keeps their values', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_OK, {})

    await apiClient.get('api/v1/employees', { params: { perPage: 20, sort: '-hire_date' } })

    expect(lastRequest?.params).toEqual({ per_page: 20, sort: '-hire_date' })
  })
})

describe('apiClient responses', (): void => {
  it('converts response body keys to camelCase', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_OK, {
      data: [{ full_name: 'Asha Rao' }],
      meta: { total_count: 1 },
    })

    const response: AxiosResponse = await apiClient.get('api/v1/employees')

    expect(response.data).toEqual({ data: [{ fullName: 'Asha Rao' }], meta: { totalCount: 1 } })
  })
})

describe('apiClient errors', (): void => {
  it('rejects with the API error message', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_NOT_FOUND, { error: 'Employee not found' })

    await expect(apiClient.get('api/v1/employees/1')).rejects.toEqual({ error: 'Employee not found', status: HTTP_NOT_FOUND })
  })

  it('converts a 422 details field name to camelCase', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_UNPROCESSABLE, {
      error:   'Validation failed',
      details: [{ field: 'hire_date', message: 'Hire date cannot be in the future' }],
    })

    await expect(apiClient.post('api/v1/employees', {})).rejects.toEqual({
      error:   'Validation failed',
      details: [{ field: 'hireDate', message: 'Hire date cannot be in the future' }],
      status:  HTTP_UNPROCESSABLE,
    })
  })

  it('rejects with the fallback message on a network error', async (): Promise<void> => {
    apiClient.defaults.adapter = failWithNetworkError()

    await expect(apiClient.get('api/v1/employees')).rejects.toEqual({ error: NETWORK_ERROR_MESSAGE })
  })

  it('rejects with a generic message when the error body is not ours', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_BAD_GATEWAY, '<html>Bad Gateway</html>')

    await expect(apiClient.get('api/v1/employees')).rejects.toEqual({ error: UNEXPECTED_ERROR_MESSAGE, status: HTTP_BAD_GATEWAY })
  })
})

describe('apiClient session expiry', (): void => {
  const NOT_AUTHENTICATED: string = 'Please log in to continue'

  afterEach((): void => {
    setSessionExpiredHandler(null)
  })

  it('reports an expired session when a protected request returns 401', async (): Promise<void> => {
    const onSessionExpired: () => void = vi.fn()
    setSessionExpiredHandler(onSessionExpired)
    apiClient.defaults.adapter = respondWith(HTTP_UNAUTHORIZED, { error: NOT_AUTHENTICATED })

    await expect(apiClient.get(API_ENDPOINTS.employees)).rejects.toEqual({ error: NOT_AUTHENTICATED, status: HTTP_UNAUTHORIZED })
    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  // These two answer 401 as part of their job: "not logged in yet" and "wrong password".
  it.each([API_ENDPOINTS.currentUser, API_ENDPOINTS.login])('does not report it for %s', async (url: string): Promise<void> => {
    const onSessionExpired: () => void = vi.fn()
    setSessionExpiredHandler(onSessionExpired)
    apiClient.defaults.adapter = respondWith(HTTP_UNAUTHORIZED, { error: NOT_AUTHENTICATED })

    await expect(apiClient.post(url)).rejects.toEqual({ error: NOT_AUTHENTICATED, status: HTTP_UNAUTHORIZED })
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('does not report it for other errors', async (): Promise<void> => {
    const onSessionExpired: () => void = vi.fn()
    setSessionExpiredHandler(onSessionExpired)
    apiClient.defaults.adapter = respondWith(HTTP_NOT_FOUND, { error: 'Employee not found' })

    await expect(apiClient.get(API_ENDPOINTS.employeeById(1))).rejects.toBeDefined()
    expect(onSessionExpired).not.toHaveBeenCalled()
  })
})
