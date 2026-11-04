import { Container, MantineProvider, Text, Title } from '@mantine/core'

import { APP_NAME } from '@src/constants/app_constants'
import { theme } from '@src/styles/theme'

// Holds the providers; the router and pages are added in W3.
export function App(): React.JSX.Element {
  return (
    <MantineProvider theme={theme}>
      <Container py="xl">
        <Title order={1}>{APP_NAME}</Title>
        <Text c="dimmed">Employees and salary insights for the HR team.</Text>
      </Container>
    </MantineProvider>
  )
}
