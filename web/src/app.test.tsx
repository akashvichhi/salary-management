import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '@src/app'
import { APP_NAME } from '@src/constants/app_constants'
import { EMPLOYEES_PAGE_TITLE, SALARY_INSIGHTS_PAGE_TITLE } from '@src/constants/navigation_constants'

describe('App', (): void => {
  it('opens the employees page and shows the app name in the shell', async (): Promise<void> => {
    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: EMPLOYEES_PAGE_TITLE })).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: EMPLOYEES_PAGE_TITLE })).toHaveAttribute('aria-current', 'page')
  })

  it('moves to the salary insights page from the navigation', async (): Promise<void> => {
    render(<App />)

    fireEvent.click(await screen.findByRole('link', { name: SALARY_INSIGHTS_PAGE_TITLE }))

    expect(await screen.findByRole('heading', { level: 1, name: SALARY_INSIGHTS_PAGE_TITLE })).toBeInTheDocument()
  })
})
