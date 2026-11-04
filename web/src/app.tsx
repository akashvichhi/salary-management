import { RouterProvider } from 'react-router'

import { MantineProvider } from '@mantine/core'
import { ErrorBoundary } from 'react-error-boundary'

import { AppErrorFallback } from '@src/routes/app_error_fallback'
import { appRouter } from '@src/routes/app_router'
import { theme } from '@src/styles/theme'
import { logRenderError } from '@src/utils/log_render_error'

// The providers around the app. The root error boundary sits outside them, in main.tsx.
export function App(): React.JSX.Element {
  return (
    <MantineProvider theme={theme}>
      <ErrorBoundary FallbackComponent={AppErrorFallback} onError={logRenderError}>
        <RouterProvider router={appRouter} />
      </ErrorBoundary>
    </MantineProvider>
  )
}
