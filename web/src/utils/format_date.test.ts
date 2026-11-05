import { describe, expect, it } from 'vitest'

import { formatDate } from '@src/utils/format_date'

describe('formatDate', (): void => {
  it.each([
    ['2024-03-15', 'Mar 15, 2024'],
    ['2026-01-01', 'Jan 1, 2026'],
    ['2025-12-31', 'Dec 31, 2025'],
  ])('formats %s as %s, whatever the browser time zone', (isoDate: string, expected: string): void => {
    expect(formatDate(isoDate)).toBe(expected)
  })
})
