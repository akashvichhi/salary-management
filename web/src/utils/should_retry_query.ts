import { HTTP_CLIENT_ERROR_MAX, HTTP_CLIENT_ERROR_MIN } from '@src/constants/http_status'
import { QUERY_RETRY_COUNT } from '@src/constants/query_constants'

// React Query types a failure as unknown; the API client always rejects with an IApiError.
function isClientError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false
  const { status } = error
  return typeof status === 'number' && status >= HTTP_CLIENT_ERROR_MIN && status <= HTTP_CLIENT_ERROR_MAX
}

// Only network and server errors are worth a second try. A retried 401 would expire the session
// twice, and a 404 or 422 would only make the user wait for the same answer.
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return !isClientError(error) && failureCount < QUERY_RETRY_COUNT
}
