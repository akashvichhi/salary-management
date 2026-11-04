export const NEW_VERSION_RELOAD_GUARD_MS: number = 10_000
export const NEW_VERSION_RELOAD_STORAGE_KEY: string = 'salary-management:new-version-reloaded-at'

export const GLOBAL_ERROR_NOTIFICATION_INTERVAL_MS: number = 5_000

// What browsers and bundlers say when a lazy file can't be downloaded (Chrome, Safari, Firefox, webpack-style).
export const CHUNK_LOAD_ERROR_NAME: string = 'ChunkLoadError'
export const CHUNK_LOAD_ERROR_MESSAGES: readonly string[] = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
]

// Harmless browser noise that must not reach the user.
export const IGNORED_ERROR_MESSAGES: readonly string[] = ['ResizeObserver loop']
