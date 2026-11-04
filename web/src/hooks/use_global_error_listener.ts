import { useEffect } from 'react'

import { notifications } from '@mantine/notifications'

import {
  GLOBAL_ERROR_NOTIFICATION_INTERVAL_MS,
  IGNORED_ERROR_MESSAGES,
} from '@src/constants/error_handling_constants'
import { UNEXPECTED_ERROR_MESSAGE } from '@src/constants/error_messages'
import { isChunkLoadError } from '@src/utils/is_chunk_load_error'

const NOTIFICATION_COLOR: string = 'red'

function isIgnoredNoise(message: string): boolean {
  return IGNORED_ERROR_MESSAGES.some((ignored: string): boolean => message.includes(ignored))
}

/**
 * Safety net for errors outside rendering (event handlers, async code), which error boundaries never see.
 * Logs every error, but notifies at most once per interval so a burst doesn't flood the screen.
 */
export function useGlobalErrorListener(): void {
  useEffect((): (() => void) => {
    let lastNotifiedAt: number = -Infinity

    function report(error: unknown, message: string): void {
      if (isChunkLoadError(error) || isIgnoredNoise(message)) return

      console.error(error)
      const now: number = Date.now()
      if (now - lastNotifiedAt < GLOBAL_ERROR_NOTIFICATION_INTERVAL_MS) return

      lastNotifiedAt = now
      notifications.show({ color: NOTIFICATION_COLOR, message: UNEXPECTED_ERROR_MESSAGE })
    }

    function handleError(event: ErrorEvent): void {
      report(event.error, event.message)
    }

    function handleRejection(event: PromiseRejectionEvent): void {
      report(event.reason, '')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return (): void => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
}
