import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RELOAD_LABEL, ROOT_ERROR_TITLE } from '@src/constants/error_messages'
import { RootErrorBoundary } from '@src/ui/feedback/root_error_boundary'

function ThrowingProvider(): React.JSX.Element {
  throw new Error('Theme setup failed')
}

beforeEach((): void => {
  vi.spyOn(console, 'error').mockImplementation((): void => {})
})

afterEach((): void => {
  vi.restoreAllMocks()
})

describe('RootErrorBoundary', (): void => {
  it('shows the plain fallback when a provider throws, without any provider around it', (): void => {
    render(
      <RootErrorBoundary>
        <ThrowingProvider />
      </RootErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: ROOT_ERROR_TITLE })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: RELOAD_LABEL })).toHaveAttribute('href', '/')
    expect(screen.queryByText(/Theme setup failed/)).not.toBeInTheDocument()
  })
})
