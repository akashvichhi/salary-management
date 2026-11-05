import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { App } from '@src/app'
import { RootErrorBoundary } from '@src/ui/feedback/root_error_boundary'
import { reloadForNewVersion } from '@src/utils/reload_for_new_version'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

// Vite fires this when a lazy file fails to download, usually because a deploy replaced it.
// If the reload guard blocks the reload, the error is left to reach the route boundary's message.
window.addEventListener('vite:preloadError', (event: Event): void => {
  if (reloadForNewVersion()) event.preventDefault()
})

const rootElement: HTMLElement | null = document.getElementById('root')
if (!rootElement) throw new Error('The #root element is missing from index.html')

const root: Root = createRoot(rootElement)
root.render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
