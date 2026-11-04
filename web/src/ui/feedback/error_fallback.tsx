import { Button, Container, Stack, Text, Title } from '@mantine/core'

interface IErrorFallbackProps {
  title:       string
  message:     string
  actionLabel: string
  onAction:    () => void
}

export function ErrorFallback({ title, message, actionLabel, onAction }: IErrorFallbackProps): React.JSX.Element {
  return (
    <Container py="xl" size="xs">
      <Stack align="center" gap="md" role="alert">
        <Title order={2} ta="center">{title}</Title>
        <Text c="dimmed" ta="center">{message}</Text>
        <Button onClick={onAction}>{actionLabel}</Button>
      </Stack>
    </Container>
  )
}
