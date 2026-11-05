import { QueryClient } from '@tanstack/react-query'

import { QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from '@src/constants/query_constants'

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: QUERY_STALE_TIME_MS, retry: QUERY_RETRY_COUNT },
  },
})
