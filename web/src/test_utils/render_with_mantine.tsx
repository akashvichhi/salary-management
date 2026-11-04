import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'

import { theme } from '@src/styles/theme'

export function renderWithMantine(ui: React.ReactElement): RenderResult {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>)
}
