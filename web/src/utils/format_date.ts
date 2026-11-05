import { APP_LOCALE, APP_TIMEZONE } from '@src/constants/time_constants'

const dateFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: 'medium',
  timeZone:  APP_TIMEZONE,
})

// "2024-03-15" parses as UTC midnight, which is the same calendar day in IST.
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
