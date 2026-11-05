import { Skeleton, Stack, VisuallyHidden } from '@mantine/core'

interface ITableSkeletonProps {
  label:    string
  rowCount: number
}

const ROW_HEIGHT: number = 36

// A header bar over `rowCount` row bars, the same height as the table rows they stand in for.
export function TableSkeleton({ label, rowCount }: ITableSkeletonProps): React.JSX.Element {
  const rowKeys: number[] = Array.from({ length: rowCount }, (_value: unknown, index: number): number => index)

  return (
    <Stack aria-busy gap="xs">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton h={ROW_HEIGHT} />
      {rowKeys.map((key: number): React.JSX.Element => <Skeleton key={key} h={ROW_HEIGHT} />)}
    </Stack>
  )
}
