import { describe, expect, it } from 'vitest'

import { NETWORK_ERROR_MESSAGE } from '@src/constants/error_messages'
import type { IApiError } from '@src/types/api_response'
import { shouldRetryQuery } from '@src/utils/should_retry_query'

function answered(status: number): IApiError {
  return { error: 'Request failed', status }
}

describe('shouldRetryQuery', (): void => {
  it.each([400, 401, 404, 422, 429])('never retries a %s: the server has answered', (status: number): void => {
    expect(shouldRetryQuery(0, answered(status))).toBe(false)
  })

  it.each([
    ['a network error', { error: NETWORK_ERROR_MESSAGE }],
    ['a server error', answered(500)],
  ])('retries %s once', (_: string, error: IApiError): void => {
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(false)
  })
})
