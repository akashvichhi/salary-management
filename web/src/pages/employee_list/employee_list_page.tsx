import { EMPLOYEES_PAGE_TITLE } from '@src/constants/navigation_constants'
import { PageHeader } from '@src/ui/layout/page_header'

export default function EmployeeListPage(): React.JSX.Element {
  return <PageHeader title={EMPLOYEES_PAGE_TITLE} />
}
