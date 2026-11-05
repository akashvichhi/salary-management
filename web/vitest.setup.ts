import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach((): void => {
  cleanup()
})

// findBy* and waitFor give up after 1 s by default. A Mantine page with a full table can take
// longer than that to re-render in jsdom on a loaded machine; a wrong assertion still fails, later.
const ASYNC_QUERY_TIMEOUT_MS: number = 3_000
configure({ asyncUtilTimeout: ASYNC_QUERY_TIMEOUT_MS })

// jsdom has no matchMedia or ResizeObserver; Mantine needs both to render.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value:    (query: string): MediaQueryList => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         (): void => {},
    removeListener:      (): void => {},
    addEventListener:    (): void => {},
    removeEventListener: (): void => {},
    dispatchEvent:       (): boolean => false,
  }),
})

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

window.ResizeObserver = ResizeObserverStub

// jsdom has no scrollIntoView; Mantine's combobox calls it to keep the active option visible.
Element.prototype.scrollIntoView = (): void => {}
