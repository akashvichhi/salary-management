import { createTheme, rem } from '@mantine/core'
import type { MantineThemeOverride } from '@mantine/core'

// The same scale as the SCSS tokens in CLAUDE.md, so `gap="md"` equals `spacing.$md`.
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
})
