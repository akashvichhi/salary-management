import { EMPLOYEES_PAGE_TITLE } from '@src/constants/navigation_constants'
import { EmployeeListContent } from '@src/pages/employee_list/components/employee_list_content'
import { useEmployeeList } from '@src/pages/employee_list/hooks/use_employee_list'
import { PageHeader } from '@src/ui/layout/page_header'

export default function EmployeeListPage(): React.JSX.Element {
  const { page, setPage, employeesQuery } = useEmployeeList()

  return (
    <>
      <PageHeader title={EMPLOYEES_PAGE_TITLE} />
      <EmployeeListContent employeesQuery={employeesQuery} page={page} onPageChange={setPage} />
    </>
  )
}
