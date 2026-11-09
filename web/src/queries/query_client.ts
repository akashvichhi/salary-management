import { QueryClient } from '@tanstack/react-query'

import { QUERY_STALE_TIME_MS } from '@src/constants/query_constants'
import { shouldRetryQuery } from '@src/utils/should_retry_query'

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: QUERY_STALE_TIME_MS, retry: shouldRetryQuery },
  },
})
