import type { Location } from 'react-router'

import { ROUTE_PATHS } from '@src/routes/route_paths'

interface ILoginRedirectState {
  from: { pathname: string, search: string }
}

export function loginRedirectState(location: Location): ILoginRedirectState {
  return { from: { pathname: location.pathname, search: location.search } }
}

function isLoginRedirectState(state: unknown): state is ILoginRedirectState {
  if (typeof state !== 'object' || state === null || !('from' in state)) return false
  const { from } = state as { from: unknown }
  return typeof from === 'object' && from !== null
    && typeof (from as { pathname?: unknown }).pathname === 'string'
    && typeof (from as { search?: unknown }).search === 'string'
}

// The page the user asked for before logging in, query string included; the employees page otherwise.
export function pathAfterLogin(state: unknown): string {
  if (!isLoginRedirectState(state)) return ROUTE_PATHS.employees
  return `${state.from.pathname}${state.from.search}`
}
