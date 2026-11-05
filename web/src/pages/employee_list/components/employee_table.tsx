import { memo } from 'react'

import { Table } from '@mantine/core'

import {
  COUNTRY_NAME_BY_CODE,
  EMPLOYEE_COLUMN_LABELS,
  EMPLOYEE_SORT_FIELDS,
  EMPLOYEE_TABLE_MAX_HEIGHT,
} from '@src/constants/employee_constants'
import { SortableHeader } from '@src/pages/employee_list/components/sortable_header'
import type { IEmployee, TEmployeeColumn } from '@src/types/employee'
import { formatCurrency } from '@src/utils/format_currency'
import { formatDate } from '@src/utils/format_date'

interface IEmployeeTableProps {
  employees: IEmployee[]
  sort:      string
  onSort:    (sort: string) => void
}

interface IEmployeeRowProps {
  employee: IEmployee
}

// Below this width the table scrolls sideways instead of squashing the columns.
const TABLE_MIN_WIDTH: number = 900

// Column order; salary is right-aligned so the amounts line up.
const COLUMNS: readonly TEmployeeColumn[] = ['fullName', 'email', 'jobTitle', 'department', 'country', 'salary', 'hireDate']
const RIGHT_ALIGNED_COLUMN: TEmployeeColumn = 'salary'

const EmployeeRow: React.NamedExoticComponent<IEmployeeRowProps> = memo(function EmployeeRow({
  employee,
}: IEmployeeRowProps): React.JSX.Element {
  return (
    <Table.Tr>
      <Table.Td>{employee.fullName}</Table.Td>
      <Table.Td>{employee.email}</Table.Td>
      <Table.Td>{employee.jobTitle}</Table.Td>
      <Table.Td>{employee.department}</Table.Td>
      <Table.Td>{COUNTRY_NAME_BY_CODE.get(employee.country) ?? employee.country}</Table.Td>
      <Table.Td ta="right">{formatCurrency(employee.salary)}</Table.Td>
      <Table.Td>{formatDate(employee.hireDate)}</Table.Td>
    </Table.Tr>
  )
})

export function EmployeeTable({ employees, sort, onSort }: IEmployeeTableProps): React.JSX.Element {
  return (
    <Table.ScrollContainer maxHeight={EMPLOYEE_TABLE_MAX_HEIGHT} minWidth={TABLE_MIN_WIDTH}>
      <Table highlightOnHover stickyHeader striped>
        <Table.Thead>
          <Table.Tr>
            {COLUMNS.map((column: TEmployeeColumn): React.JSX.Element => (
              <SortableHeader
                key={column}
                alignRight={column === RIGHT_ALIGNED_COLUMN}
                currentSort={sort}
                field={EMPLOYEE_SORT_FIELDS[column]}
                label={EMPLOYEE_COLUMN_LABELS[column]}
                onSort={onSort}
              />
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee: IEmployee): React.JSX.Element => (
            <EmployeeRow key={employee.id} employee={employee} />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
