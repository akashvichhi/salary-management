import { APP_LOCALE } from '@src/constants/time_constants'

// One formatter per currency, built the first time it is needed: building one costs far more than
// formatting with it, and a table formats hundreds of amounts.
const formatterByCurrency: Map<string, Intl.NumberFormat> = new Map<string, Intl.NumberFormat>()

function currencyFormatter(currency: string): Intl.NumberFormat {
  const cached: Intl.NumberFormat | undefined = formatterByCurrency.get(currency)
  if (cached) return cached
  const formatter: Intl.NumberFormat = new Intl.NumberFormat(APP_LOCALE, { style: 'currency', currency })
  formatterByCurrency.set(currency, formatter)
  return formatter
}

// Formats the API's decimal string directly: Intl reads it exactly, so no cent is lost to a float.
export function formatCurrency(amount: string, currency: string): string {
  return currencyFormatter(currency).format(amount as Intl.StringNumericLiteral)
}
