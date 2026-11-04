import { Link, Outlet, useLocation } from 'react-router'

import { AppShell, Button, Container, Group, Text } from '@mantine/core'

import { APP_NAME } from '@src/constants/app_constants'
import {
  EMPLOYEES_PAGE_TITLE,
  MAIN_NAVIGATION_LABEL,
  SALARY_INSIGHTS_PAGE_TITLE,
} from '@src/constants/navigation_constants'
import { ROUTE_PATHS } from '@src/routes/route_paths'

interface INavigationItem {
  label: string
  path:  string
}

const HEADER_HEIGHT: number = 60

const NAVIGATION_ITEMS: readonly INavigationItem[] = [
  { label: EMPLOYEES_PAGE_TITLE, path: ROUTE_PATHS.employees },
  { label: SALARY_INSIGHTS_PAGE_TITLE, path: ROUTE_PATHS.salaryInsights },
]

function MainNavigation(): React.JSX.Element {
  const { pathname } = useLocation()

  return (
    <Group aria-label={MAIN_NAVIGATION_LABEL} component="nav" gap="xs">
      {NAVIGATION_ITEMS.map((item: INavigationItem): React.JSX.Element => {
        const isActive: boolean = pathname.startsWith(item.path)
        return (
          <Button
            key={item.path}
            aria-current={isActive ? 'page' : undefined}
            component={Link}
            to={item.path}
            variant={isActive ? 'light' : 'subtle'}
          >
            {item.label}
          </Button>
        )
      })}
    </Group>
  )
}

// The shell stays on screen while pages load or fail inside it.
export function AppLayout(): React.JSX.Element {
  return (
    <AppShell header={{ height: HEADER_HEIGHT }} padding="md">
      <AppShell.Header>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between">
            <Text fw="bold" visibleFrom="sm">{APP_NAME}</Text>
            <MainNavigation />
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
