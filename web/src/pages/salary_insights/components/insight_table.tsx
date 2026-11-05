import { Table } from '@mantine/core'

export interface IInsightColumn<T> {
  label:      string
  render:     (row: T) => string
  // Numbers are right-aligned, so their digits line up.
  isNumeric?: boolean
}

interface IInsightTableProps<T> {
  columns: readonly IInsightColumn<T>[]
  rows:    readonly T[]
  rowKey:  (row: T) => string
}

// A plain table of one insight: the API has already computed every value; columns only format them.
export function InsightTable<T>({ columns, rows, rowKey }: IInsightTableProps<T>): React.JSX.Element {
  return (
    <Table.ScrollContainer minWidth={0}>
      <Table highlightOnHover striped>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column: IInsightColumn<T>): React.JSX.Element => (
              <Table.Th key={column.label} ta={column.isNumeric ? 'right' : undefined}>{column.label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row: T): React.JSX.Element => (
            <Table.Tr key={rowKey(row)}>
              {columns.map((column: IInsightColumn<T>): React.JSX.Element => (
                <Table.Td key={column.label} ta={column.isNumeric ? 'right' : undefined}>{column.render(row)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
