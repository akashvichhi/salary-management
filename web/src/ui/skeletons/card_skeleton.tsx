import { Paper, SimpleGrid, Skeleton, Stack, VisuallyHidden } from '@mantine/core'

interface ICardSkeletonProps {
  label:     string
  cardCount: number
}

const LABEL_HEIGHT: number = 14
const LABEL_WIDTH: string = '50%'
const VALUE_HEIGHT: number = 32
const GRID_COLUMNS: { base: number, sm: number } = { base: 1, sm: 2 }

// Stat cards: a short label bar over a taller value bar, in the same grid as the real cards.
export function CardSkeleton({ label, cardCount }: ICardSkeletonProps): React.JSX.Element {
  const cardKeys: number[] = Array.from({ length: cardCount }, (_value: unknown, index: number): number => index)

  return (
    <SimpleGrid aria-busy cols={GRID_COLUMNS} spacing="md">
      <VisuallyHidden>{label}</VisuallyHidden>
      {cardKeys.map((key: number): React.JSX.Element => (
        <Paper key={key} withBorder p="md">
          <Stack gap="xs">
            <Skeleton h={LABEL_HEIGHT} w={LABEL_WIDTH} />
            <Skeleton h={VALUE_HEIGHT} />
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  )
}
