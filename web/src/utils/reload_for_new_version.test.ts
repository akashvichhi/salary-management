import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NEW_VERSION_RELOAD_GUARD_MS } from '@src/constants/error_handling_constants'
import { reloadForNewVersion } from '@src/utils/reload_for_new_version'
import { reloadPage } from '@src/utils/reload_page'

vi.mock('@src/utils/reload_page', (): { reloadPage: () => void } => ({ reloadPage: vi.fn() }))

const NOW: Date = new Date('2026-11-04T10:00:00+05:30')

beforeEach((): void => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  sessionStorage.clear()
  vi.mocked(reloadPage).mockClear()
})

afterEach((): void => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('reloadForNewVersion', (): void => {
  it('reloads the page the first time', (): void => {
    expect(reloadForNewVersion()).toBe(true)
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  it('does not reload again within the guard window', (): void => {
    reloadForNewVersion()
    vi.advanceTimersByTime(NEW_VERSION_RELOAD_GUARD_MS - 1)

    expect(reloadForNewVersion()).toBe(false)
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  it('reloads again once the guard window has passed', (): void => {
    reloadForNewVersion()
    vi.advanceTimersByTime(NEW_VERSION_RELOAD_GUARD_MS)

    expect(reloadForNewVersion()).toBe(true)
    expect(reloadPage).toHaveBeenCalledTimes(2)
  })

  it('does not reload when it cannot remember the reload', (): void => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((): string | null => {
      throw new Error('Storage is disabled')
    })

    expect(reloadForNewVersion()).toBe(false)
    expect(reloadPage).not.toHaveBeenCalled()
  })
})
