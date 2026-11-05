import type { IApiError } from '@src/types/api_response'
import type { IUser } from '@src/types/auth'

const HTTP_UNAUTHORIZED: number = 401

export function buildUser(overrides: Partial<IUser> = {}): IUser {
  return { id: 1, email: 'hr@acme.com', ...overrides }
}

// What the API client rejects with when there is no session.
export const NOT_LOGGED_IN_ERROR: IApiError = { error: 'Please log in to continue', status: HTTP_UNAUTHORIZED }
