import dayjs from 'dayjs'

import { APP_DATE_FORMAT } from '@src/constants/time_constants'

// For a date with no time ("2024-03-15"): dayjs reads it as that calendar day, so no time zone can
// move it to the day before or after.
export function formatDate(isoDate: string): string {
  return dayjs(isoDate).format(APP_DATE_FORMAT)
}
