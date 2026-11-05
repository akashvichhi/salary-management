import { Route, Routes } from 'react-router'

import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser, login } from '@src/api/auth_api'
import {
  EMAIL_LABEL,
  LOGIN_BUTTON_LABEL,
  LOGIN_PAGE_TITLE,
  PASSWORD_LABEL,
  PASSWORD_REQUIRED_MESSAGE,
} from '@src/constants/auth_messages'
import { EMAIL_INVALID_MESSAGE } from '@src/constants/employee_messages'
import LoginPage from '@src/pages/login/login_page'
import { ROUTE_PATHS } from '@src/routes/route_paths'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import { buildUser, NOT_LOGGED_IN_ERROR } from '@src/test_utils/user_factory'
import type { IUser } from '@src/types/auth'

vi.mock('@src/api/auth_api')

const INVALID_CREDENTIALS_MESSAGE: string = 'Invalid email or password'
const EMPLOYEES_PAGE_TEXT: string = 'Employee list'

function neverResolves(): Promise<IUser> {
  return new Promise((): void => {})
}

function renderLoginPage(): void {
  renderWithProviders(
    <Routes>
      <Route element={<LoginPage />} path={ROUTE_PATHS.login} />
      <Route element={<p>{EMPLOYEES_PAGE_TEXT}</p>} path={ROUTE_PATHS.employees} />
    </Routes>,
    { route: ROUTE_PATHS.login },
  )
}

function fillIn(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label, { exact: false, selector: 'input' }), { target: { value } })
}

function submit(): void {
  fireEvent.click(screen.getByRole('button', { name: LOGIN_BUTTON_LABEL }))
}

beforeEach((): void => {
  vi.resetAllMocks()
  vi.mocked(getCurrentUser).mockRejectedValue(NOT_LOGGED_IN_ERROR)
})

describe('LoginPage', (): void => {
  it('asks for an email and a password, each with a visible label', async (): Promise<void> => {
    renderLoginPage()

    expect(await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })).toBeInTheDocument()
    expect(screen.getByLabelText(EMAIL_LABEL, { exact: false, selector: 'input' })).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(PASSWORD_LABEL, { exact: false, selector: 'input' })).toHaveAttribute('type', 'password')
  })

  it('checks both fields before calling the API', async (): Promise<void> => {
    renderLoginPage()
    await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })

    submit()

    expect(await screen.findByText(EMAIL_INVALID_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText(PASSWORD_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('sends the trimmed email and the password exactly as typed', async (): Promise<void> => {
    vi.mocked(login).mockResolvedValue(buildUser())
    renderLoginPage()
    await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })

    fillIn(EMAIL_LABEL, '  hr@acme.com ')
    fillIn(PASSWORD_LABEL, ' secret ')
    submit()

    expect(await screen.findByText(EMPLOYEES_PAGE_TEXT)).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'hr@acme.com', password: ' secret ' })
  })

  it('shows the API message when login fails, without saying which field was wrong', async (): Promise<void> => {
    vi.mocked(login).mockRejectedValue({ error: INVALID_CREDENTIALS_MESSAGE, status: 401 })
    renderLoginPage()
    await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })

    fillIn(EMAIL_LABEL, 'hr@acme.com')
    fillIn(PASSWORD_LABEL, 'wrong')
    submit()

    expect(within(await screen.findByRole('alert')).getByText(INVALID_CREDENTIALS_MESSAGE)).toBeInTheDocument()
  })

  it('disables the button while logging in, so it cannot be sent twice', async (): Promise<void> => {
    vi.mocked(login).mockImplementation(neverResolves)
    renderLoginPage()
    await screen.findByRole('heading', { level: 1, name: LOGIN_PAGE_TITLE })

    fillIn(EMAIL_LABEL, 'hr@acme.com')
    fillIn(PASSWORD_LABEL, 'secret')
    submit()

    expect(await screen.findByRole('button', { name: LOGIN_BUTTON_LABEL })).toBeDisabled()
  })

  it('sends someone already logged in on to the employees page', async (): Promise<void> => {
    vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
    renderLoginPage()

    expect(await screen.findByText(EMPLOYEES_PAGE_TEXT)).toBeInTheDocument()
  })
})
