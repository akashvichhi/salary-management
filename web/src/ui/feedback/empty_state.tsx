import { Stack, Text, Title } from '@mantine/core'

interface IEmptyStateProps {
  title:   string
  message: string
  action?: React.ReactNode
}

export function EmptyState({ title, message, action }: IEmptyStateProps): React.JSX.Element {
  return (
    <Stack align="center" gap="sm" py="xl">
      <Title order={2} ta="center">{title}</Title>
      <Text c="dimmed" ta="center">{message}</Text>
      {action}
    </Stack>
  )
}
