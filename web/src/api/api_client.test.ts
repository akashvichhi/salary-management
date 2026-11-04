import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { apiClient } from '@src/api/api_client'
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'

const HTTP_OK: number = 200
const FIRST_ERROR_STATUS: number = 400
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

    await expect(apiClient.get('api/v1/employees/1')).rejects.toEqual({ error: 'Employee not found' })
  })

  it('converts a 422 details field name to camelCase', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_UNPROCESSABLE, {
      error:   'Validation failed',
      details: [{ field: 'hire_date', message: 'Hire date cannot be in the future' }],
    })

    await expect(apiClient.post('api/v1/employees', {})).rejects.toEqual({
      error:   'Validation failed',
      details: [{ field: 'hireDate', message: 'Hire date cannot be in the future' }],
    })
  })

  it('rejects with the fallback message on a network error', async (): Promise<void> => {
    apiClient.defaults.adapter = failWithNetworkError()

    await expect(apiClient.get('api/v1/employees')).rejects.toEqual({ error: NETWORK_ERROR_MESSAGE })
  })

  it('rejects with a generic message when the error body is not ours', async (): Promise<void> => {
    apiClient.defaults.adapter = respondWith(HTTP_BAD_GATEWAY, '<html>Bad Gateway</html>')

    await expect(apiClient.get('api/v1/employees')).rejects.toEqual({ error: UNEXPECTED_ERROR_MESSAGE })
  })
})
