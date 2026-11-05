import { useCallback } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { Center } from '@mantine/core'

import { SESSION_CHECK_ERROR_TITLE, SESSION_CHECK_LABEL } from '@src/constants/auth_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import { useCurrentUserQuery } from '@src/queries/auth_queries'
import { ROUTE_PATHS } from '@src/routes/route_paths'
import { ErrorState } from '@src/ui/feedback/error_state'
import { FullScreenLoader } from '@src/ui/feedback/full_screen_loader'
import { isUnauthenticatedError } from '@src/utils/is_unauthenticated_error'
import { loginRedirectState } from '@src/utils/login_redirect'

// Every page except login renders inside this: the session is checked once, then the page shows.
export function ProtectedRoute(): React.JSX.Element {
  const location: ReturnType<typeof useLocation> = useLocation()
  const { data: user, error, refetch } = useCurrentUserQuery()

  const handleRetry: () => void = useCallback((): void => {
    void refetch()
  }, [refetch])

  if (error && isUnauthenticatedError(error)) {
    return <Navigate replace state={loginRedirectState(location)} to={ROUTE_PATHS.login} />
  }
  if (error) {
    return (
      <Center>
        <ErrorState actionLabel={TRY_AGAIN_LABEL} message={error.error} title={SESSION_CHECK_ERROR_TITLE} onAction={handleRetry} />
      </Center>
    )
  }
  if (!user) return <FullScreenLoader label={SESSION_CHECK_LABEL} />
  return <Outlet />
}
