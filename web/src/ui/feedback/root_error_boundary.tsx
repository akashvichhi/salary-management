import { ErrorBoundary } from 'react-error-boundary'

import { RootErrorFallback } from '@src/ui/feedback/root_error_fallback'
import { logRenderError } from '@src/utils/log_render_error'

interface IRootErrorBoundaryProps {
  children: React.ReactNode
}

// The last resort, outside every provider (see main.tsx).
export function RootErrorBoundary({ children }: IRootErrorBoundaryProps): React.JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={RootErrorFallback} onError={logRenderError}>
      {children}
    </ErrorBoundary>
  )
}
