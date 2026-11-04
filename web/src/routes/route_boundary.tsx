import { Suspense, useMemo } from 'react'
import type { ErrorInfo } from 'react'
import { useLocation } from 'react-router'

import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import {
  NEW_VERSION_MESSAGE,
  NEW_VERSION_TITLE,
  PAGE_ERROR_MESSAGE,
  PAGE_ERROR_TITLE,
  RELOAD_LABEL,
  TRY_AGAIN_LABEL,
} from '@src/constants/error_messages'
import { ErrorFallback } from '@src/ui/feedback/error_fallback'
import { PageSkeleton } from '@src/ui/skeletons/page_skeleton'
import { isChunkLoadError } from '@src/utils/is_chunk_load_error'
import { logRenderError } from '@src/utils/log_render_error'
import { reloadForNewVersion } from '@src/utils/reload_for_new_version'
import { reloadPage } from '@src/utils/reload_page'

interface IRouteBoundaryProps {
  children: React.ReactNode
}

// A missing page file means a new deploy replaced it, so the app reloads instead of logging a bug.
function handleRouteError(error: unknown, info: ErrorInfo): void {
  if (isChunkLoadError(error)) {
    reloadForNewVersion()
    return
  }
  logRenderError(error, info)
}

function RouteErrorFallback({ error, resetErrorBoundary }: FallbackProps): React.JSX.Element {
  if (isChunkLoadError(error)) {
    return (
      <ErrorFallback
        actionLabel={RELOAD_LABEL}
        message={NEW_VERSION_MESSAGE}
        title={NEW_VERSION_TITLE}
        onAction={reloadPage}
      />
    )
  }

  return (
    <ErrorFallback
      actionLabel={TRY_AGAIN_LABEL}
      message={PAGE_ERROR_MESSAGE}
      title={PAGE_ERROR_TITLE}
      onAction={resetErrorBoundary}
    />
  )
}

// Wraps every lazy page: errors stay inside the page area, and leaving the page clears them.
export function RouteBoundary({ children }: IRouteBoundaryProps): React.JSX.Element {
  const { pathname } = useLocation()
  const resetKeys: string[] = useMemo<string[]>((): string[] => [pathname], [pathname])

  return (
    <ErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={resetKeys} onError={handleRouteError}>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
