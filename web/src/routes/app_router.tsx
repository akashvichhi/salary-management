import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import type { RouteObject } from 'react-router'

import { AppErrorFallback } from '@src/routes/app_error_fallback'
import { AppLayout } from '@src/routes/app_layout'
import { ProtectedRoute } from '@src/routes/protected_route'
import { RouteBoundary } from '@src/routes/route_boundary'
import { ROUTE_PATHS } from '@src/routes/route_paths'

type TLazyPage = React.LazyExoticComponent<() => React.JSX.Element>

const EmployeeListPage: TLazyPage = lazy(
  (): Promise<{ default: () => React.JSX.Element }> => import('@src/pages/employee_list/employee_list_page'),
)
const LoginPage: TLazyPage = lazy(
  (): Promise<{ default: () => React.JSX.Element }> => import('@src/pages/login/login_page'),
)
const SalaryInsightsPage: TLazyPage = lazy(
  (): Promise<{ default: () => React.JSX.Element }> => import('@src/pages/salary_insights/salary_insights_page'),
)

const redirectToEmployees: React.JSX.Element = <Navigate replace to={ROUTE_PATHS.employees} />

// Login is the only page outside the protected route, and outside the app shell.
const appRoutes: RouteObject[] = [
  {
    path:         ROUTE_PATHS.home,
    // Replaces React Router's developer error screen
    errorElement: <AppErrorFallback />,
    children:     [
      { path: ROUTE_PATHS.login, element: <RouteBoundary><LoginPage /></RouteBoundary> },
      {
        element:  <ProtectedRoute />,
        children: [
          {
            element:  <AppLayout />,
            children: [
              { index: true, element: redirectToEmployees },
              { path: ROUTE_PATHS.employees, element: <RouteBoundary><EmployeeListPage /></RouteBoundary> },
              { path: ROUTE_PATHS.salaryInsights, element: <RouteBoundary><SalaryInsightsPage /></RouteBoundary> },
              { path: '*', element: redirectToEmployees },
            ],
          },
        ],
      },
    ],
  },
]

export const appRouter: ReturnType<typeof createBrowserRouter> = createBrowserRouter(appRoutes)
