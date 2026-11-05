import { APP_CURRENCY, APP_LOCALE } from '@src/constants/time_constants'

const currencyFormatter: Intl.NumberFormat = new Intl.NumberFormat(APP_LOCALE, { style: 'currency', currency: APP_CURRENCY })

// Formats the API's decimal string directly: Intl reads it exactly, so no cent is lost to a float.
export function formatCurrency(amount: string): string {
  return currencyFormatter.format(amount as Intl.StringNumericLiteral)
}
