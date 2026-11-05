import { MemoryRouter } from 'react-router'

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'

import { theme } from '@src/styles/theme'

interface IRenderOptions {
  route?: string
}

// A fresh QueryClient per test (no shared cache) that fails fast instead of retrying.
export function renderWithProviders(ui: React.ReactElement, { route = '/' }: IRenderOptions = {}): RenderResult {
  const queryClient: QueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  )
}
