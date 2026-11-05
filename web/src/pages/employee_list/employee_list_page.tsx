import { useCallback } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import { DEFAULT_PER_PAGE, EMPLOYEE_TABLE_MAX_HEIGHT } from '@src/constants/employee_constants'
import { EMPLOYEE_OPTIONS_LOAD_ERROR_TITLE, EMPLOYEES_LOADING_LABEL } from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import { EMPLOYEES_PAGE_TITLE } from '@src/constants/navigation_constants'
import { EmployeeListView } from '@src/pages/employee_list/components/employee_list_view'
import { useEmployeeOptionsQuery } from '@src/queries/employee_queries'
import type { IApiError } from '@src/types/api_response'
import type { IEmployeeSelectOptions } from '@src/types/employee'
import { ErrorState } from '@src/ui/feedback/error_state'
import { PageHeader } from '@src/ui/layout/page_header'
import { TableSkeleton } from '@src/ui/skeletons/table_skeleton'

// The filters, the form and the URL check all need the dropdown lists, so the page waits for them
// (one small request per visit, cached after that) before asking for employees.
export default function EmployeeListPage(): React.JSX.Element {
  const optionsQuery: UseQueryResult<IEmployeeSelectOptions, IApiError> = useEmployeeOptionsQuery()
  const { data, error, refetch } = optionsQuery

  const handleRetry: () => void = useCallback((): void => {
    void refetch()
  }, [refetch])

  if (data) return <EmployeeListView options={data} />

  return (
    <>
      <PageHeader title={EMPLOYEES_PAGE_TITLE} />
      {error ? (
        <ErrorState
          actionLabel={TRY_AGAIN_LABEL}
          message={error.error}
          title={EMPLOYEE_OPTIONS_LOAD_ERROR_TITLE}
          onAction={handleRetry}
        />
      ) : (
        <TableSkeleton label={EMPLOYEES_LOADING_LABEL} maxHeight={EMPLOYEE_TABLE_MAX_HEIGHT} rowCount={DEFAULT_PER_PAGE} />
      )}
    </>
  )
}
