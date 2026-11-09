import { Route, Routes, useLocation } from 'react-router'

import type { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser, login, logout } from '@src/api/auth_api'
import {
  EMAIL_LABEL,
  LOGIN_BUTTON_LABEL,
  LOGIN_PAGE_TITLE,
  LOGOUT_BUTTON_LABEL,
  PASSWORD_LABEL,
  SESSION_CHECK_ERROR_TITLE,
  SESSION_CHECK_LABEL,
} from '@src/constants/auth_messages'
import { NETWORK_ERROR_MESSAGE, TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import { employeeKeys } from '@src/constants/query_keys'
import LoginPage from '@src/pages/login/login_page'
import { AppLayout } from '@src/routes/app_layout'
import { ProtectedRoute } from '@src/routes/protected_route'
import { ROUTE_PATHS } from '@src/routes/route_paths'
import { buildEmployeeOptions } from '@src/test_utils/employee_options_factory'
import { createTestQueryClient, renderWithProviders } from '@src/test_utils/render_with_providers'
import { buildUser, NOT_LOGGED_IN_ERROR } from '@src/test_utils/user_factory'
import type { IUser } from '@src/types/auth'

vi.mock('@src/api/auth_api')

const WANTED_PAGE: string = `${ROUTE_PATHS.employees}?page=2&country=IN`

function neverResolves(): Promise<IUser> {
  return new Promise((): void => {})
}

// Stands in for a page: shows where the user ended up, query string included.
function CurrentLocation(): React.JSX.Element {
  const { pathname, search } = useLocation()
  return <p>{`${pathname}${search}`}</p>
}

function renderApp(route: string = WANTED_PAGE, queryClient: QueryClient = createTestQueryClient()): void {
  renderWithProviders(
    <Routes>
      <Route element={<LoginPage />} path={ROUTE_PATHS.login} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<CurrentLocation />} path={ROUTE_PATHS.employees} />
        </Route>
      </Route>
    </Routes>,
    { route, queryClient },
  )
}

beforeEach((): void => {
  vi.resetAllMocks()
})

describe('ProtectedRoute', (): void => {
  it('shows the full-screen loader while the session is checked', (): void => {
    vi.mocked(getCurrentUser).mockImplementation(neverResolves)
    renderApp()

    expect(screen.getByRole('status', { name: SESSION_CHECK_LABEL })).toBeInTheDocument()
  })

  it('shows the page once the session is confirmed', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    renderApp()

    expect(await screen.findByText(WANTED_PAGE)).toBeInTheDocument()
  })

  it('sends a visitor who is not logged in to login, then back to the page they wanted', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockRejectedValue(NOT_LOGGED_IN_ERROR)
    vi.mocked(login).mockResolvedValue(buildUser())
    renderApp()

    expect(await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(EMAIL_LABEL, { exact: false, selector: 'input' }), { target: { value: 'hr@acme.com' } })
    fireEvent.change(screen.getByLabelText(PASSWORD_LABEL, { exact: false, selector: 'input' }), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: LOGIN_BUTTON_LABEL }))

    expect(await screen.findByText(WANTED_PAGE)).toBeInTheDocument()
  })

  it('shows an error with a retry when the session check fails for another reason', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce({ error: NETWORK_ERROR_MESSAGE })
    renderApp()

    expect(await screen.findByRole('heading', { name: SESSION_CHECK_ERROR_TITLE })).toBeInTheDocument()
    expect(screen.getByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument()

    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(await screen.findByText(WANTED_PAGE)).toBeInTheDocument()
  })
})

describe('Logout', (): void => {
  it('ends the session, clears the cache and returns to login', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    vi.mocked(logout).mockResolvedValue(undefined)
    const queryClient: QueryClient = createTestQueryClient()
    queryClient.setQueryData(employeeKeys.options(), buildEmployeeOptions())
    renderApp(WANTED_PAGE, queryClient)

    vi.mocked(getCurrentUser).mockRejectedValue(NOT_LOGGED_IN_ERROR)
    fireEvent.click(await screen.findByRole('button', { name: LOGOUT_BUTTON_LABEL }))

    expect(await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(employeeKeys.options())).toBeUndefined()
  })

  it('does not remember the page logged out of, so the next login starts afresh', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    vi.mocked(logout).mockResolvedValue(undefined)
    vi.mocked(login).mockResolvedValue(buildUser())
    renderApp()

    vi.mocked(getCurrentUser).mockRejectedValue(NOT_LOGGED_IN_ERROR)
    fireEvent.click(await screen.findByRole('button', { name: LOGOUT_BUTTON_LABEL }))
    expect(await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(EMAIL_LABEL, { exact: false, selector: 'input' }), { target: { value: 'hr@acme.com' } })
    fireEvent.change(screen.getByLabelText(PASSWORD_LABEL, { exact: false, selector: 'input' }), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: LOGIN_BUTTON_LABEL }))

    expect(await screen.findByText(ROUTE_PATHS.employees)).toBeInTheDocument()
    // Only the login page's own session check, never the page just left asking again.
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it('stays on the page and shows the API message when logout fails', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    vi.mocked(logout).mockRejectedValue({ error: NETWORK_ERROR_MESSAGE })
    renderApp()

    fireEvent.click(await screen.findByRole('button', { name: LOGOUT_BUTTON_LABEL }))

    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText(WANTED_PAGE)).toBeInTheDocument()
  })
})
