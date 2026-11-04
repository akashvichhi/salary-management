import { lazy } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'

import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PAGE_LOADING_LABEL } from '@src/constants/app_constants'
import {
  NEW_VERSION_TITLE,
  PAGE_ERROR_TITLE,
  RELOAD_LABEL,
  TRY_AGAIN_LABEL,
} from '@src/constants/error_messages'
import { RouteBoundary } from '@src/routes/route_boundary'
import { renderWithMantine } from '@src/test_utils/render_with_mantine'
import { reloadPage } from '@src/utils/reload_page'

vi.mock('@src/utils/reload_page', (): { reloadPage: () => void } => ({ reloadPage: vi.fn() }))

const BROKEN_PATH: string = '/broken'
const WORKING_PATH: string = '/working'
const PAGE_TEXT: string = 'The page content'

type TRouter = ReturnType<typeof createMemoryRouter>

let shouldThrow: boolean = false

function PageThatMayThrow(): React.JSX.Element {
  if (shouldThrow) throw new Error('Render failed')
  return <p>{PAGE_TEXT}</p>
}

function PageThatThrowsOnBrokenPath(): React.JSX.Element {
  const { pathname } = useLocation()
  if (pathname === BROKEN_PATH) throw new Error('Render failed')
  return <p>{PAGE_TEXT}</p>
}

function PageThatFailsToDownload(): React.JSX.Element {
  throw new TypeError('Failed to fetch dynamically imported module: https://app.example/assets/abc123.js')
}

function renderInRouteBoundary(page: React.ReactElement, initialPath: string = WORKING_PATH): TRouter {
  const router: TRouter = createMemoryRouter(
    [{ path: '*', element: <RouteBoundary>{page}</RouteBoundary> }],
    { initialEntries: [initialPath] },
  )
  renderWithMantine(<RouterProvider router={router} />)
  return router
}

beforeEach((): void => {
  shouldThrow = false
  sessionStorage.clear()
  vi.mocked(reloadPage).mockClear()
  // React and the boundary log caught errors; keep the test output readable.
  vi.spyOn(console, 'error').mockImplementation((): void => {})
})

afterEach((): void => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('RouteBoundary', (): void => {
  it('renders the page when nothing fails', (): void => {
    renderInRouteBoundary(<PageThatMayThrow />)

    expect(screen.getByText(PAGE_TEXT)).toBeInTheDocument()
  })

  it('shows the page skeleton while a lazy page loads', (): void => {
    const NeverLoadingPage: React.LazyExoticComponent<() => React.JSX.Element> = lazy(
      (): Promise<{ default: () => React.JSX.Element }> => new Promise((): void => {}),
    )

    renderInRouteBoundary(<NeverLoadingPage />)

    expect(screen.getByText(PAGE_LOADING_LABEL)).toBeInTheDocument()
  })

  it('shows the fallback when the page throws, and "Try again" recovers once the error is gone', (): void => {
    shouldThrow = true
    renderInRouteBoundary(<PageThatMayThrow />)

    expect(screen.getByRole('heading', { name: PAGE_ERROR_TITLE })).toBeInTheDocument()
    expect(screen.queryByText(PAGE_TEXT)).not.toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(screen.getByText(PAGE_TEXT)).toBeInTheDocument()
  })

  it('clears the error when the user navigates away', async (): Promise<void> => {
    const router: TRouter = renderInRouteBoundary(<PageThatThrowsOnBrokenPath />, BROKEN_PATH)
    expect(screen.getByRole('heading', { name: PAGE_ERROR_TITLE })).toBeInTheDocument()

    await act(async (): Promise<void> => {
      await router.navigate(WORKING_PATH)
    })

    expect(screen.getByText(PAGE_TEXT)).toBeInTheDocument()
  })

  it('never shows the error details to the user', (): void => {
    shouldThrow = true
    renderInRouteBoundary(<PageThatMayThrow />)

    expect(screen.queryByText(/Render failed/)).not.toBeInTheDocument()
  })

  it('reloads once for a missing page file, then shows the new version message', (): void => {
    vi.useFakeTimers({ toFake: ['Date'] })

    renderInRouteBoundary(<PageThatFailsToDownload />)
    expect(reloadPage).toHaveBeenCalledTimes(1)
    cleanup()

    renderInRouteBoundary(<PageThatFailsToDownload />)

    expect(reloadPage).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: NEW_VERSION_TITLE })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: RELOAD_LABEL })).toBeInTheDocument()
  })
})
