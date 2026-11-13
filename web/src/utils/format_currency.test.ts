import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@src/utils/format_currency'

describe('formatCurrency', (): void => {
  it.each([
    ['85000.00', 'USD', '$85,000.00'],
    ['0.5', 'USD', '$0.50'],
    ['1234567890.12', 'USD', '$1,234,567,890.12'],
    ['7522500.00', 'INR', '₹7,522,500.00'],
    ['73100.00', 'EUR', '€73,100.00'],
  ])('formats %s %s as %s', (amount: string, currency: string, expected: string): void => {
    expect(formatCurrency(amount, currency)).toBe(expected)
  })

  it('keeps every cent of an amount too precise for a float', (): void => {
    expect(formatCurrency('9999999999.99', 'USD')).toBe('$9,999,999,999.99')
  })
})
