import { MemoryRouter } from 'react-router'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'

import { theme } from '@src/styles/theme'

interface IRenderOptions {
  route?:       string
  // Passed in when a test needs to look at the cache (e.g. that logout clears it).
  queryClient?: QueryClient
}

// A fresh QueryClient per test (no shared cache) that fails fast instead of retrying.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', queryClient = createTestQueryClient() }: IRenderOptions = {},
): RenderResult {
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider env="test" theme={theme}>
        <Notifications />
        <ModalsProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>,
  )
}
