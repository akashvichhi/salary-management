import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach((): void => {
  cleanup()
})

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
