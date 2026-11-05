type TRouteName = 'home' | 'login' | 'employees' | 'salaryInsights'

export const ROUTE_PATHS: Readonly<Record<TRouteName, string>> = {
  home:           '/',
  login:          '/login',
  employees:      '/employees',
  salaryInsights: '/salary-insights',
}
