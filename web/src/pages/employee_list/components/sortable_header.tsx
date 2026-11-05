import { memo, useCallback } from 'react'

import { Table, UnstyledButton } from '@mantine/core'
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'

type TAriaSort = 'ascending' | 'descending' | 'none'

interface ISortableHeaderProps {
  label:       string
  field:       string
  currentSort: string
  alignRight?: boolean
  onSort:      (sort: string) => void
  onClearSort: () => void
}

const DESCENDING_PREFIX: string = '-'
const ICON_SIZE: number = 14

function ariaSortFor(field: string, currentSort: string): TAriaSort {
  if (currentSort === field) return 'ascending'
  if (currentSort === `${DESCENDING_PREFIX}${field}`) return 'descending'
  return 'none'
}

const SORT_ICONS: Readonly<Record<TAriaSort, React.JSX.Element>> = {
  ascending:  <IconSortAscending aria-hidden size={ICON_SIZE} />,
  descending: <IconSortDescending aria-hidden size={ICON_SIZE} />,
  none:       <IconArrowsSort aria-hidden size={ICON_SIZE} />,
}

// A column header that sorts by its field: the first click sorts ascending, the second reverses it,
// and the third clears the sort, back to the list's default.
// The direction is announced through aria-sort and shown by an icon, never by colour alone.
export const SortableHeader: React.NamedExoticComponent<ISortableHeaderProps> = memo(function SortableHeader({
  label,
  field,
  currentSort,
  alignRight = false,
  onSort,
  onClearSort,
}: ISortableHeaderProps): React.JSX.Element {
  const ariaSort: TAriaSort = ariaSortFor(field, currentSort)

  const handleClick: () => void = useCallback((): void => {
    if (ariaSort === 'descending') onClearSort()
    else onSort(ariaSort === 'ascending' ? `${DESCENDING_PREFIX}${field}` : field)
  }, [ariaSort, field, onSort, onClearSort])

  return (
    <Table.Th aria-sort={ariaSort} ta={alignRight ? 'right' : undefined}>
      <UnstyledButton fw="bold" fz="sm" onClick={handleClick}>
        {label} {SORT_ICONS[ariaSort]}
      </UnstyledButton>
    </Table.Th>
  )
})
