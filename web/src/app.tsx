import { RouterProvider } from 'react-router'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

import { useGlobalErrorListener } from '@src/hooks/use_global_error_listener'
import { queryClient } from '@src/queries/query_client'
import { AppErrorFallback } from '@src/routes/app_error_fallback'
import { appRouter } from '@src/routes/app_router'
import { theme } from '@src/styles/theme'
import { logRenderError } from '@src/utils/log_render_error'

function GlobalErrorListener(): null {
  useGlobalErrorListener()
  return null
}

// The providers around the app. The root error boundary sits outside them, in main.tsx.
export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications />
        <GlobalErrorListener />
        <ErrorBoundary FallbackComponent={AppErrorFallback} onError={logRenderError}>
          <RouterProvider router={appRouter} />
        </ErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  )
}
