import { Skeleton, Stack, VisuallyHidden } from '@mantine/core'

interface ITableSkeletonProps {
  label:      string
  rowCount:   number
  // The table's own height limit: only the rows that fit inside it are drawn.
  maxHeight?: number
}

const ROW_HEIGHT: number = 36

// A header bar over the row bars, the same height as the table rows they stand in for.
export function TableSkeleton({ label, rowCount, maxHeight }: ITableSkeletonProps): React.JSX.Element {
  const rowsThatFit: number = maxHeight ? Math.floor(maxHeight / ROW_HEIGHT) - 1 : rowCount
  const visibleRowCount: number = Math.min(rowCount, rowsThatFit)
  const rowKeys: number[] = Array.from({ length: visibleRowCount }, (_value: unknown, index: number): number => index)

  return (
    <Stack aria-busy gap="xs">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton h={ROW_HEIGHT} />
      {rowKeys.map((key: number): React.JSX.Element => <Skeleton key={key} h={ROW_HEIGHT} />)}
    </Stack>
  )
}
