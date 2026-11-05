import { Center, Loader } from '@mantine/core'

interface IFullScreenLoaderProps {
  label: string
}

const FULL_SCREEN_HEIGHT: string = '100vh'

// Only for the first session check, before the app shell can be shown (CLAUDE.md, Loading states).
export function FullScreenLoader({ label }: IFullScreenLoaderProps): React.JSX.Element {
  return (
    <Center aria-label={label} mih={FULL_SCREEN_HEIGHT} role="status">
      <Loader />
    </Center>
  )
}
