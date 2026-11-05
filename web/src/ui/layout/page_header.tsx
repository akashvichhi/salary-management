import { Group, Title } from '@mantine/core'

interface IPageHeaderProps {
  title:   string
  // The page's main action (e.g. an "Add" button), shown on the right.
  action?: React.ReactNode
}

export function PageHeader({ title, action }: IPageHeaderProps): React.JSX.Element {
  return (
    <Group justify="space-between" mb="lg">
      <Title order={1}>{title}</Title>
      {action}
    </Group>
  )
}
