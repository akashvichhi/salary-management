import { Container } from '@mantine/core'

import { ErrorState } from '@src/ui/feedback/error_state'

interface IErrorFallbackProps {
  title:       string
  message:     string
  actionLabel: string
  onAction:    () => void
}

// The error boundaries' fallback: the same message and action as a failed query, in a narrow column.
export function ErrorFallback(props: IErrorFallbackProps): React.JSX.Element {
  return (
    <Container size="xs">
      <ErrorState {...props} />
    </Container>
  )
}
