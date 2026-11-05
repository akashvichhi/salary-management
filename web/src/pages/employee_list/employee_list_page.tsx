import { Stack } from '@mantine/core'

import { EMPLOYEES_PAGE_TITLE } from '@src/constants/navigation_constants'
import { EmployeeFilters } from '@src/pages/employee_list/components/employee_filters'
import { EmployeeListContent } from '@src/pages/employee_list/components/employee_list_content'
import { useEmployeeList } from '@src/pages/employee_list/hooks/use_employee_list'
import { PageHeader } from '@src/ui/layout/page_header'

export default function EmployeeListPage(): React.JSX.Element {
  const { listState, employeesQuery } = useEmployeeList()

  return (
    <>
      <PageHeader title={EMPLOYEES_PAGE_TITLE} />
      <Stack gap="lg">
        <EmployeeFilters listState={listState} />
        <EmployeeListContent employeesQuery={employeesQuery} listState={listState} />
      </Stack>
    </>
  )
}
