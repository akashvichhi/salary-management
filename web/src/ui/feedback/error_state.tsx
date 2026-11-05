import { Button, Stack, Text, Title } from '@mantine/core'

interface IErrorStateProps {
  title:       string
  message:     string
  actionLabel: string
  onAction:    () => void
}

export function ErrorState({ title, message, actionLabel, onAction }: IErrorStateProps): React.JSX.Element {
  return (
    <Stack align="center" gap="md" py="xl" role="alert">
      <Title order={2} ta="center">{title}</Title>
      <Text c="dimmed" ta="center">{message}</Text>
      <Button onClick={onAction}>{actionLabel}</Button>
    </Stack>
  )
}
