import { APP_LOCALE } from '@src/constants/time_constants'

const countFormatter: Intl.NumberFormat = new Intl.NumberFormat(APP_LOCALE)

// A whole count with thousands separators: 10000 → "10,000".
export function formatCount(count: number): string {
  return countFormatter.format(count)
}
