import { Skeleton, Stack, VisuallyHidden } from '@mantine/core'

import { PAGE_LOADING_LABEL } from '@src/constants/app_constants'

const TITLE_HEIGHT: number = 36
const TITLE_WIDTH: string = '40%'
const CONTENT_HEIGHT: number = 320

// Shaped like a page: a heading over a block of content.
export function PageSkeleton(): React.JSX.Element {
  return (
    <Stack aria-busy gap="lg">
      <VisuallyHidden>{PAGE_LOADING_LABEL}</VisuallyHidden>
      <Skeleton h={TITLE_HEIGHT} w={TITLE_WIDTH} />
      <Skeleton h={CONTENT_HEIGHT} />
    </Stack>
  )
}
