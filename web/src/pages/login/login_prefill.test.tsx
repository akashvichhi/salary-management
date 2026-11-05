import { Route, Routes } from 'react-router'

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser, login } from '@src/api/auth_api'
import { EMAIL_LABEL, LOGIN_BUTTON_LABEL, PASSWORD_LABEL } from '@src/constants/auth_messages'
import LoginPage from '@src/pages/login/login_page'
import { ROUTE_PATHS } from '@src/routes/route_paths'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import { buildUser, NOT_LOGGED_IN_ERROR } from '@src/test_utils/user_factory'

const DEMO_EMAIL: string = 'hr@example.com'
const DEMO_PASSWORD: string = 'Hr@2026'

vi.mock('@src/api/auth_api')
vi.mock('@src/config/env', (): Record<string, string> => ({
  API_URL:             '/',
  DEMO_LOGIN_EMAIL:    'hr@example.com',
  DEMO_LOGIN_PASSWORD: 'Hr@2026',
}))

beforeEach((): void => {
  vi.resetAllMocks()
  vi.mocked(getCurrentUser).mockRejectedValue(NOT_LOGGED_IN_ERROR)
})

describe('LoginPage with demo credentials configured', (): void => {
  it('starts filled in, so logging in is one click', async (): Promise<void> => {
    vi.mocked(login).mockResolvedValue(buildUser())
    renderWithProviders(
      <Routes>
        <Route element={<LoginPage />} path={ROUTE_PATHS.login} />
        <Route element={<p>Employee list</p>} path={ROUTE_PATHS.employees} />
      </Routes>,
      { route: ROUTE_PATHS.login },
    )

    expect(await screen.findByLabelText(EMAIL_LABEL, { exact: false, selector: 'input' })).toHaveValue(DEMO_EMAIL)
    expect(screen.getByLabelText(PASSWORD_LABEL, { exact: false, selector: 'input' })).toHaveValue(DEMO_PASSWORD)

    fireEvent.click(screen.getByRole('button', { name: LOGIN_BUTTON_LABEL }))

    expect(await screen.findByText('Employee list')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
  })
})
