import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@src/utils/format_currency'

describe('formatCurrency', (): void => {
  it.each([
    ['85000.00', '$85,000.00'],
    ['0.5', '$0.50'],
    ['1234567890.12', '$1,234,567,890.12'],
  ])('formats %s as %s', (amount: string, expected: string): void => {
    expect(formatCurrency(amount)).toBe(expected)
  })

  it('keeps every cent of an amount too precise for a float', (): void => {
    expect(formatCurrency('9999999999.99')).toBe('$9,999,999,999.99')
  })
})
