// The UI shows dates only (no times), which no time zone can shift; formatDate explains why. The
// first timestamp shown must be formatted in IST (the API's +05:30), never the browser's zone.
export const APP_LOCALE: string = 'en-US'
// Figures that add up several countries are converted to this currency by the API (decision 4).
export const REPORTING_CURRENCY: string = 'USD'
// How every date is shown, in tables and date inputs alike (a dayjs format): "15/03/2024".
export const APP_DATE_FORMAT: string = 'DD/MM/YYYY'
