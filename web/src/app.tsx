import { RouterProvider } from 'react-router'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

import { setSessionExpiredHandler } from '@src/api/api_client'
import { DEFAULT_COLOR_SCHEME } from '@src/constants/app_constants'
import { useGlobalErrorListener } from '@src/hooks/use_global_error_listener'
import { expireSession } from '@src/queries/auth_queries'
import { queryClient } from '@src/queries/query_client'
import { AppErrorFallback } from '@src/routes/app_error_fallback'
import { appRouter } from '@src/routes/app_router'
import { theme } from '@src/styles/theme'
import { logRenderError } from '@src/utils/log_render_error'

// The API client reports a 401 mid-session here, so it needs no access to the cache itself.
setSessionExpiredHandler((): void => expireSession(queryClient))

function GlobalErrorListener(): null {
  useGlobalErrorListener()
  return null
}

// The providers around the app. The root error boundary sits outside them, in main.tsx.
export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme={DEFAULT_COLOR_SCHEME} theme={theme}>
        <Notifications />
        <GlobalErrorListener />
        <ErrorBoundary FallbackComponent={AppErrorFallback} onError={logRenderError}>
          <ModalsProvider>
            <RouterProvider router={appRouter} />
          </ModalsProvider>
        </ErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  )
}
