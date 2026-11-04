import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '@src/app'
import { APP_NAME } from '@src/constants/app_constants'

describe('App', (): void => {
  it('renders the app name as the page heading', (): void => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: APP_NAME })).toBeInTheDocument()
  })
})
