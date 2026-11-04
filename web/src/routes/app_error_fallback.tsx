import { APP_ERROR_MESSAGE, APP_ERROR_TITLE, RELOAD_LABEL } from '@src/constants/error_messages'
import { ErrorFallback } from '@src/ui/feedback/error_fallback'
import { reloadPage } from '@src/utils/reload_page'

// Full-page fallback for the app boundary and the router's root errorElement.
export function AppErrorFallback(): React.JSX.Element {
  return (
    <ErrorFallback
      actionLabel={RELOAD_LABEL}
      message={APP_ERROR_MESSAGE}
      title={APP_ERROR_TITLE}
      onAction={reloadPage}
    />
  )
}
