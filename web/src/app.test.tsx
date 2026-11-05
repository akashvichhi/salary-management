import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser } from '@src/api/auth_api'
import { getEmployeeOptions, getEmployees } from '@src/api/employee_api'
import { App } from '@src/app'
import { APP_NAME } from '@src/constants/app_constants'
import { EMPLOYEES_PAGE_TITLE, SALARY_INSIGHTS_PAGE_TITLE } from '@src/constants/navigation_constants'
import { buildPage } from '@src/test_utils/employee_factory'
import { buildEmployeeOptions } from '@src/test_utils/employee_options_factory'
import { buildUser } from '@src/test_utils/user_factory'

vi.mock('@src/api/auth_api')
vi.mock('@src/api/employee_api')

// The first lazy page load transforms its modules, which can take longer than the default second.
const LAZY_PAGE_TIMEOUT_MS: number = 5_000
const PREFERS_DARK_QUERY: string = '(prefers-color-scheme: dark)'
const COLOR_SCHEME_ATTRIBUTE: string = 'data-mantine-color-scheme'

// The operating system's light or dark setting, as the browser reports it through matchMedia.
function setSystemColorScheme(scheme: 'light' | 'dark'): void {
  const stubMatchMedia: typeof window.matchMedia = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string): MediaQueryList => ({
    ...stubMatchMedia(query),
    matches: query === PREFERS_DARK_QUERY && scheme === 'dark',
  }))
}

beforeEach((): void => {
  vi.mocked(getCurrentUser).mockResolvedValue(buildUser())
  vi.mocked(getEmployees).mockResolvedValue(buildPage([]))
  vi.mocked(getEmployeeOptions).mockResolvedValue(buildEmployeeOptions())
})

afterEach((): void => {
  vi.restoreAllMocks()
})

describe('App', (): void => {
  it('opens the employees page and shows the app name in the shell', async (): Promise<void> => {
    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: EMPLOYEES_PAGE_TITLE }, { timeout: LAZY_PAGE_TIMEOUT_MS })).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: EMPLOYEES_PAGE_TITLE })).toHaveAttribute('aria-current', 'page')
  })

  it('moves to the salary insights page from the navigation', async (): Promise<void> => {
    render(<App />)

    fireEvent.click(await screen.findByRole('link', { name: SALARY_INSIGHTS_PAGE_TITLE }, { timeout: LAZY_PAGE_TIMEOUT_MS }))

    expect(await screen.findByRole('heading', { level: 1, name: SALARY_INSIGHTS_PAGE_TITLE }, { timeout: LAZY_PAGE_TIMEOUT_MS })).toBeInTheDocument()
  })
})

describe('App colour scheme', (): void => {
  it('is dark when the system is set to dark', async (): Promise<void> => {
    setSystemColorScheme('dark')
    render(<App />)

    await screen.findByText(APP_NAME, {}, { timeout: LAZY_PAGE_TIMEOUT_MS })
    expect(document.documentElement).toHaveAttribute(COLOR_SCHEME_ATTRIBUTE, 'dark')
  })

  it('is light when the system is set to light', async (): Promise<void> => {
    setSystemColorScheme('light')
    render(<App />)

    await screen.findByText(APP_NAME, {}, { timeout: LAZY_PAGE_TIMEOUT_MS })
    expect(document.documentElement).toHaveAttribute(COLOR_SCHEME_ATTRIBUTE, 'light')
  })
})
