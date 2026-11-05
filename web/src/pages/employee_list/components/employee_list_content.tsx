import { useCallback } from 'react'

import { Button, Group, Loader, Pagination, Select, Stack, Text, VisuallyHidden } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'

import { EMPLOYEE_TABLE_MAX_HEIGHT, PER_PAGE_OPTIONS } from '@src/constants/employee_constants'
import {
  CLEAR_FILTERS_LABEL,
  employeeCountLabel,
  EMPLOYEES_EMPTY_MESSAGE,
  EMPLOYEES_EMPTY_TITLE,
  EMPLOYEES_FILTERED_EMPTY_MESSAGE,
  EMPLOYEES_FILTERED_EMPTY_TITLE,
  EMPLOYEES_LOAD_ERROR_TITLE,
  EMPLOYEES_LOADING_LABEL,
  EMPLOYEES_UPDATING_LABEL,
  ROWS_PER_PAGE_LABEL,
} from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import { APP_LOCALE } from '@src/constants/time_constants'
import type { IListUrlState } from '@src/hooks/use_list_url_state'
import { EmployeeTable } from '@src/pages/employee_list/components/employee_table'
import type { IApiError } from '@src/types/api_response'
import type { IEmployee, TEmployeeFilterKey } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'
import { EmptyState } from '@src/ui/feedback/empty_state'
import { ErrorState } from '@src/ui/feedback/error_state'
import { TableSkeleton } from '@src/ui/skeletons/table_skeleton'

interface IEmployeeListContentProps {
  listState:      IListUrlState<TEmployeeFilterKey>
  employeesQuery: UseQueryResult<IPaginatedResponse<IEmployee>, IApiError>
}

const countFormatter: Intl.NumberFormat = new Intl.NumberFormat(APP_LOCALE)
const PER_PAGE_SELECT_DATA: string[] = PER_PAGE_OPTIONS.map(String)
const PER_PAGE_SELECT_WIDTH: number = 96

// One of: skeleton (first load), error with retry, empty state, or the table with pagination.
export function EmployeeListContent({ listState, employeesQuery }: IEmployeeListContentProps): React.JSX.Element {
  const { page, perPage, sort, hasActiveFilters, setPage, setPerPage, setSort, clearFilters } = listState
  const { data, error, isPending, isPlaceholderData, refetch } = employeesQuery

  const handleRetry: () => void = useCallback((): void => {
    void refetch()
  }, [refetch])

  const handlePageChange: (nextPage: number) => void = useCallback((nextPage: number): void => {
    setPage(nextPage)
  }, [setPage])

  const handlePerPageChange: (value: string | null) => void = useCallback((value: string | null): void => {
    if (value) setPerPage(Number(value))
  }, [setPerPage])

  if (isPending) return <TableSkeleton label={EMPLOYEES_LOADING_LABEL} maxHeight={EMPLOYEE_TABLE_MAX_HEIGHT} rowCount={perPage} />

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

  if (data.data.length === 0 && hasActiveFilters) {
    return (
      <EmptyState
        action={<Button variant="light" onClick={clearFilters}>{CLEAR_FILTERS_LABEL}</Button>}
        message={EMPLOYEES_FILTERED_EMPTY_MESSAGE}
        title={EMPLOYEES_FILTERED_EMPTY_TITLE}
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
      <EmployeeTable employees={data.data} sort={sort} onSort={setSort} />
      <Group justify="space-between">
        {data.meta.totalPages > 1 ? (
          <Pagination total={data.meta.totalPages} value={page} onChange={handlePageChange} />
        ) : <span />}
        <Select
          allowDeselect={false}
          data={PER_PAGE_SELECT_DATA}
          label={ROWS_PER_PAGE_LABEL}
          value={String(perPage)}
          w={PER_PAGE_SELECT_WIDTH}
          onChange={handlePerPageChange}
        />
      </Group>
    </Stack>
  )
}
