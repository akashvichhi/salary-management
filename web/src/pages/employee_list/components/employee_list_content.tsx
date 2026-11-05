import { useCallback } from 'react'

import { Group, Loader, Pagination, Stack, Text, VisuallyHidden } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'

import { DEFAULT_PER_PAGE } from '@src/constants/employee_constants'
import {
  employeeCountLabel,
  EMPLOYEES_EMPTY_MESSAGE,
  EMPLOYEES_EMPTY_TITLE,
  EMPLOYEES_LOAD_ERROR_TITLE,
  EMPLOYEES_LOADING_LABEL,
  EMPLOYEES_UPDATING_LABEL,
} from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import { APP_LOCALE } from '@src/constants/time_constants'
import { EmployeeTable } from '@src/pages/employee_list/components/employee_table'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'
import { EmptyState } from '@src/ui/feedback/empty_state'
import { ErrorState } from '@src/ui/feedback/error_state'
import { TableSkeleton } from '@src/ui/skeletons/table_skeleton'

interface IEmployeeListContentProps {
  page:           number
  onPageChange:   (page: number) => void
  employeesQuery: UseQueryResult<IPaginatedResponse<IEmployee>, IApiError>
}

const countFormatter: Intl.NumberFormat = new Intl.NumberFormat(APP_LOCALE)

// One of: skeleton (first load), error with retry, empty state, or the table with pagination.
export function EmployeeListContent({
  page,
  onPageChange,
  employeesQuery,
}: IEmployeeListContentProps): React.JSX.Element {
  const { data, error, isPending, isPlaceholderData, refetch } = employeesQuery
  const handleRetry: () => void = useCallback((): void => {
    void refetch()
  }, [refetch])

  if (isPending) return <TableSkeleton label={EMPLOYEES_LOADING_LABEL} rowCount={DEFAULT_PER_PAGE} />

  if (error) {
    return (
      <ErrorState
        actionLabel={TRY_AGAIN_LABEL}
        message={error.error}
        title={EMPLOYEES_LOAD_ERROR_TITLE}
        onAction={handleRetry}
      />
    )
  }

  if (data.data.length === 0) return <EmptyState message={EMPLOYEES_EMPTY_MESSAGE} title={EMPLOYEES_EMPTY_TITLE} />

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Text c="dimmed" size="sm">
          {employeeCountLabel(data.meta.totalCount, countFormatter.format(data.meta.totalCount))}
        </Text>
        {isPlaceholderData && (
          <Group gap="xs" role="status">
            <Loader size="xs" />
            <VisuallyHidden>{EMPLOYEES_UPDATING_LABEL}</VisuallyHidden>
          </Group>
        )}
      </Group>
      <EmployeeTable employees={data.data} />
      {data.meta.totalPages > 1 && (
        <Group justify="center">
          <Pagination total={data.meta.totalPages} value={page} onChange={onPageChange} />
        </Group>
      )}
    </Stack>
  )
}
