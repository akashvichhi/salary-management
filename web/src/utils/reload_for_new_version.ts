import { NEW_VERSION_RELOAD_GUARD_MS, NEW_VERSION_RELOAD_STORAGE_KEY } from '@src/constants/error_handling_constants'
import { reloadPage } from '@src/utils/reload_page'

/**
 * The only place that reloads for a new version. Returns whether it reloaded.
 *
 * It reloads at most once per guard window, so a file that is still missing after the reload
 * (a real outage, not a deploy) shows the "new version" message instead of looping.
 */
export function reloadForNewVersion(): boolean {
  try {
    const lastReloadAt: number = Number(sessionStorage.getItem(NEW_VERSION_RELOAD_STORAGE_KEY))
    const now: number = Date.now()
    if (lastReloadAt && now - lastReloadAt < NEW_VERSION_RELOAD_GUARD_MS) return false

    sessionStorage.setItem(NEW_VERSION_RELOAD_STORAGE_KEY, String(now))
  } catch {
    // Without storage the guard can't work, and an unguarded reload could loop forever.
    return false
  }

  reloadPage()
  return true
}
