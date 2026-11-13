import { memo, useCallback, useId } from 'react'

import { Table, Tooltip, UnstyledButton } from '@mantine/core'
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'

import { DESCENDING_PREFIX } from '@src/constants/list_constants'

type TAriaSort = 'ascending' | 'descending' | 'none'

interface ISortableHeaderProps {
  label:       string
  field:       string
  currentSort: string
  alignRight?: boolean
  // Explains how the column sorts, when that isn't what it shows.
  hint?:       string
  onSort:      (sort: string) => void
  onClearSort: () => void
}

// Smaller than ICON_SIZE, to sit beside the header's smaller text.
const SORT_ICON_SIZE: number = 14
// Shown on keyboard focus too, not only on hover, so the hint reaches every user who can see it.
// Wraps the hint onto a few lines instead of one very wide one.
const TOOLTIP_WIDTH: number = 240
const TOOLTIP_EVENTS: { hover: boolean, focus: boolean, touch: boolean } = { hover: true, focus: true, touch: true }

function ariaSortFor(field: string, currentSort: string): TAriaSort {
  if (currentSort === field) return 'ascending'
  if (currentSort === `${DESCENDING_PREFIX}${field}`) return 'descending'
  return 'none'
}

const SORT_ICONS: Readonly<Record<TAriaSort, React.JSX.Element>> = {
  ascending:  <IconSortAscending aria-hidden size={SORT_ICON_SIZE} />,
  descending: <IconSortDescending aria-hidden size={SORT_ICON_SIZE} />,
  none:       <IconArrowsSort aria-hidden size={SORT_ICON_SIZE} />,
}

// A column header that sorts by its field: the first click sorts ascending, the second reverses it,
// and the third clears the sort, back to the list's default.
// The direction is announced through aria-sort and shown by an icon, never by colour alone.
export const SortableHeader: React.NamedExoticComponent<ISortableHeaderProps> = memo(function SortableHeader({
  label,
  field,
  currentSort,
  alignRight = false,
  hint,
  onSort,
  onClearSort,
}: ISortableHeaderProps): React.JSX.Element {
  const ariaSort: TAriaSort = ariaSortFor(field, currentSort)
  const hintId: string = useId()

  const handleClick: () => void = useCallback((): void => {
    if (ariaSort === 'descending') onClearSort()
    else onSort(ariaSort === 'ascending' ? `${DESCENDING_PREFIX}${field}` : field)
  }, [ariaSort, field, onSort, onClearSort])

  const button: React.JSX.Element = (
    <UnstyledButton aria-describedby={hint ? hintId : undefined} fw="bold" fz="sm" onClick={handleClick}>
      {label} {SORT_ICONS[ariaSort]}
    </UnstyledButton>
  )

  return (
    <Table.Th aria-sort={ariaSort} ta={alignRight ? 'right' : undefined}>
      {hint ? <Tooltip multiline events={TOOLTIP_EVENTS} label={hint} w={TOOLTIP_WIDTH}>{button}</Tooltip> : button}
      {/* The hint for screen readers, always present: the tooltip is only rendered while open.
          Hidden, so it stays out of the header's name ("Salary"), which aria-describedby still reads. */}
      {hint ? <span hidden id={hintId}>{hint}</span> : null}
    </Table.Th>
  )
})
