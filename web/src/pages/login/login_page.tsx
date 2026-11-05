import { Navigate, useLocation } from 'react-router'

import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'

import { APP_NAME } from '@src/constants/app_constants'
import {
  EMAIL_LABEL,
  LOGIN_BUTTON_LABEL,
  LOGIN_PAGE_TITLE,
  PASSWORD_LABEL,
} from '@src/constants/auth_messages'
import { useLoginForm } from '@src/pages/login/hooks/use_login_form'
import { useCurrentUserQuery } from '@src/queries/auth_queries'
import { pathAfterLogin } from '@src/utils/login_redirect'

const LOGIN_CARD_MAX_WIDTH: number = 420
const FULL_SCREEN_HEIGHT: string = '100vh'

export default function LoginPage(): React.JSX.Element {
  const location: ReturnType<typeof useLocation> = useLocation()
  const { data: user } = useCurrentUserQuery()
  const { form, isLoggingIn, loginError, handleSubmit } = useLoginForm()

  // Already logged in (e.g. the login page was bookmarked): go on to the app.
  if (user) return <Navigate replace to={pathAfterLogin(location.state)} />

  return (
    <Center mih={FULL_SCREEN_HEIGHT} p="md">
      <Paper withBorder maw={LOGIN_CARD_MAX_WIDTH} p="xl" w="100%">
        <form noValidate onSubmit={handleSubmit}>
          <Stack gap="md">
            <div>
              <Text c="dimmed" size="sm">{APP_NAME}</Text>
              <Title order={1}>{LOGIN_PAGE_TITLE}</Title>
            </div>
            {loginError && <Alert color="red">{loginError}</Alert>}
            <TextInput
              withAsterisk
              autoComplete="username"
              label={EMAIL_LABEL}
              type="email"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              visibilityToggleFocusable
              withAsterisk
              autoComplete="current-password"
              label={PASSWORD_LABEL}
              {...form.getInputProps('password')}
            />
            <Button loading={isLoggingIn} type="submit">{LOGIN_BUTTON_LABEL}</Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}
