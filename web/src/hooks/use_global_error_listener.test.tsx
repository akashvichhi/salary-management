import { notifications, Notifications } from '@mantine/notifications'
import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'

import { GLOBAL_ERROR_NOTIFICATION_INTERVAL_MS } from '@src/constants/error_handling_constants'
import { UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'
import { useGlobalErrorListener } from '@src/hooks/use_global_error_listener'
import { renderWithMantine } from '@src/test_utils/render_with_mantine'

type TConsoleErrorSpy = MockInstance<typeof console.error>

let consoleErrorSpy: TConsoleErrorSpy

function ListenerHarness(): React.JSX.Element {
  useGlobalErrorListener()
  return <Notifications />
}

// jsdom has no PromiseRejectionEvent, so build the event the browser would send.
function rejectUnhandled(reason: unknown): void {
  const event: Event = new Event('unhandledrejection')
  Object.defineProperty(event, 'reason', { value: reason })
  act((): void => {
    window.dispatchEvent(event)
  })
}

function throwUncaught(error: Error | null, message: string): void {
  act((): void => {
    window.dispatchEvent(new ErrorEvent('error', { error, message }))
  })
}

beforeEach((): void => {
  vi.useFakeTimers({ toFake: ['Date'] })
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})
})

afterEach((): void => {
  act((): void => {
    notifications.clean()
  })
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useGlobalErrorListener', (): void => {
  it('shows exactly one notification for repeated unhandled rejections, and logs each one', async (): Promise<void> => {
    renderWithMantine(<ListenerHarness />)

    rejectUnhandled(new Error('Save failed'))
    rejectUnhandled(new Error('Save failed again'))

    expect(await screen.findAllByText(UNEXPECTED_ERROR_MESSAGE)).toHaveLength(1)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
  })

  it('notifies about an uncaught error', async (): Promise<void> => {
    renderWithMantine(<ListenerHarness />)

    throwUncaught(new Error('Click handler failed'), 'Click handler failed')

    expect(await screen.findByText(UNEXPECTED_ERROR_MESSAGE)).toBeInTheDocument()
  })

  it('notifies again once the interval has passed', async (): Promise<void> => {
    renderWithMantine(<ListenerHarness />)

    rejectUnhandled(new Error('First'))
    await screen.findByText(UNEXPECTED_ERROR_MESSAGE)
    vi.advanceTimersByTime(GLOBAL_ERROR_NOTIFICATION_INTERVAL_MS)
    rejectUnhandled(new Error('Second'))

    expect(await screen.findAllByText(UNEXPECTED_ERROR_MESSAGE)).toHaveLength(2)
  })

  it('ignores chunk-load errors, which the new-version reload handles', (): void => {
    renderWithMantine(<ListenerHarness />)

    rejectUnhandled(new TypeError('Failed to fetch dynamically imported module: https://app.example/assets/a.js'))

    expect(screen.queryByText(UNEXPECTED_ERROR_MESSAGE)).not.toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('ignores harmless ResizeObserver noise', (): void => {
    renderWithMantine(<ListenerHarness />)

    throwUncaught(null, 'ResizeObserver loop completed with undelivered notifications.')

    expect(screen.queryByText(UNEXPECTED_ERROR_MESSAGE)).not.toBeInTheDocument()
  })

  it('stops listening when unmounted', (): void => {
    const { unmount }: { unmount: () => void } = renderWithMantine(<ListenerHarness />)
    unmount()

    rejectUnhandled(new Error('After unmount'))

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
