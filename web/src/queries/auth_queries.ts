import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Query, QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { getCurrentUser, login, logout } from '@src/api/auth_api'
import { authKeys } from '@src/constants/query_keys'
import type { IApiError } from '@src/types/api_response'
import type { ILoginFormValues, IUser } from '@src/types/auth'
import { showErrorNotification } from '@src/utils/show_notification'

// The current user lives only in this cache entry, never in browser storage.
export function useCurrentUserQuery(): UseQueryResult<IUser, IApiError> {
  return useQuery<IUser, IApiError>({
    queryKey:  authKeys.currentUser(),
    queryFn:   (): Promise<IUser> => getCurrentUser(),
    // A 401 is an answer, not a failure worth retrying; the session only changes through
    // login, logout or expiry, which all update this entry themselves.
    retry:     false,
    staleTime: Infinity,
  })
}

export function useLoginMutation(): UseMutationResult<IUser, IApiError, ILoginFormValues> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<IUser, IApiError, ILoginFormValues>({
    mutationFn: (credentials: ILoginFormValues): Promise<IUser> => login(credentials),
    onSuccess:  (user: IUser): void => {
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}

export function useLogoutMutation(): UseMutationResult<void, IApiError, void> {
  const queryClient: QueryClient = useQueryClient()

  return useMutation<void, IApiError, void>({
    mutationFn: (): Promise<void> => logout(),
    // Nothing loaded during the session may be shown to whoever uses the browser next.
    onSuccess:  (): void => {
      queryClient.clear()
    },
    onError: (error: IApiError): void => {
      showErrorNotification(error.error)
    },
  })
}

function isAuthQuery(query: Query): boolean {
  return query.queryKey[0] === authKeys.all()[0]
}

// A request got a 401 mid-session: drop the data it loaded and check the session again, so the
// protected route sends the user to login and remembers the page they were on.
export function expireSession(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: (query: Query): boolean => !isAuthQuery(query) })
  void queryClient.resetQueries({ queryKey: authKeys.currentUser() })
}
