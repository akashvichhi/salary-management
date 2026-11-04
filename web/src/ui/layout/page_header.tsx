import { Title } from '@mantine/core'

interface IPageHeaderProps {
  title: string
}

export function PageHeader({ title }: IPageHeaderProps): React.JSX.Element {
  return <Title mb="lg" order={1}>{title}</Title>
}
