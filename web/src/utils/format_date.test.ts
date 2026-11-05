import { describe, expect, it } from 'vitest'

import { formatDate } from '@src/utils/format_date'

describe('formatDate', (): void => {
  it.each([
    ['2024-03-15', '15/03/2024'],
    ['2026-01-01', '01/01/2026'],
    ['2025-12-31', '31/12/2025'],
  ])('formats %s as %s, whatever the browser time zone', (isoDate: string, expected: string): void => {
    expect(formatDate(isoDate)).toBe(expected)
  })
})
