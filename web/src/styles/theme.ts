import { createTheme, rem } from '@mantine/core'
import type { MantineThemeOverride } from '@mantine/core'
import { DateInput, DatePickerInput } from '@mantine/dates'

import { APP_DATE_FORMAT } from '@src/constants/time_constants'

// The same scale as the SCSS tokens (docs/standards/react-typescript.md, Styling), so `gap="md"`
// equals `spacing.$md`.
// Change both together.
export const theme: MantineThemeOverride = createTheme({
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  spacing:    {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  // Every date input shows the app's one date format, unless a page asks for another.
  components: {
    DateInput:       DateInput.extend({ defaultProps: { valueFormat: APP_DATE_FORMAT } }),
    DatePickerInput: DatePickerInput.extend({ defaultProps: { valueFormat: APP_DATE_FORMAT } }),
  },
})
