import { memo } from 'react'

import { Table } from '@mantine/core'

import { COUNTRY_NAME_BY_CODE, EMPLOYEE_COLUMN_LABELS, EMPLOYEE_TABLE_MAX_HEIGHT } from '@src/constants/employee_constants'
import type { IEmployee } from '@src/types/employee'
import { formatCurrency } from '@src/utils/format_currency'
import { formatDate } from '@src/utils/format_date'

interface IEmployeeTableProps {
  employees: IEmployee[]
}

interface IEmployeeRowProps {
  employee: IEmployee
}

// Below this width the table scrolls sideways instead of squashing the columns.
const TABLE_MIN_WIDTH: number = 900

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

export function EmployeeTable({ employees }: IEmployeeTableProps): React.JSX.Element {
  return (
    <Table.ScrollContainer maxHeight={EMPLOYEE_TABLE_MAX_HEIGHT} minWidth={TABLE_MIN_WIDTH}>
      <Table highlightOnHover stickyHeader striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.fullName}</Table.Th>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.email}</Table.Th>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.jobTitle}</Table.Th>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.department}</Table.Th>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.country}</Table.Th>
            <Table.Th ta="right">{EMPLOYEE_COLUMN_LABELS.salary}</Table.Th>
            <Table.Th>{EMPLOYEE_COLUMN_LABELS.hireDate}</Table.Th>
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
