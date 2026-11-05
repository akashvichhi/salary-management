import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { useLogoutMutation } from '@src/queries/auth_queries'
import { ROUTE_PATHS } from '@src/routes/route_paths'

interface ILogout {
  logout:       () => void
  isLoggingOut: boolean
}

export function useLogout(): ILogout {
  const navigate: ReturnType<typeof useNavigate> = useNavigate()
  const { mutate, isPending } = useLogoutMutation()

  const logout: () => void = useCallback((): void => {
    mutate(undefined, {
      onSuccess: (): void => {
        void navigate(ROUTE_PATHS.login, { replace: true })
      },
    })
  }, [mutate, navigate])

  return { logout, isLoggingOut: isPending }
}
