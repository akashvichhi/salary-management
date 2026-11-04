type TRouteName = 'home' | 'employees' | 'salaryInsights'

export const ROUTE_PATHS: Readonly<Record<TRouteName, string>> = {
  home:           '/',
  employees:      '/employees',
  salaryInsights: '/salary-insights',
}
