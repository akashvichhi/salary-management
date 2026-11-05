import { HTTP_UNAUTHORIZED } from '@src/constants/http_status'
import type { IApiError } from '@src/types/api_response'

export function isUnauthenticatedError(error: IApiError): boolean {
  return error.status === HTTP_UNAUTHORIZED
}
