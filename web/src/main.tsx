import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { App } from '@src/app'

import '@mantine/core/styles.css'

const rootElement: HTMLElement | null = document.getElementById('root')
if (!rootElement) throw new Error('The #root element is missing from index.html')

const root: Root = createRoot(rootElement)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
