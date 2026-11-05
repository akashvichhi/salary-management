import { useCallback, useId } from 'react'

import { Group, Paper, Stack, Title } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'

import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import {
  INSIGHT_LOAD_ERROR_TITLE,
  INSIGHT_LOADING_LABEL,
  INSIGHTS_EMPTY_MESSAGE,
  INSIGHTS_EMPTY_TITLE,
} from '@src/constants/salary_insight_messages'
import type { IApiError } from '@src/types/api_response'
import { EmptyState } from '@src/ui/feedback/empty_state'
import { ErrorState } from '@src/ui/feedback/error_state'
import { TableSkeleton } from '@src/ui/skeletons/table_skeleton'

interface IInsightSectionProps<T> {
  title:     string
  query:     UseQueryResult<T, IApiError>
  isEmpty:   (data: T) => boolean
  children:  (data: T) => React.ReactNode
  // A control shown next to the title (e.g. the country picker).
  control?:  React.ReactNode
  // Replaces the default table skeleton (e.g. stat cards).
  skeleton?: React.ReactNode
}

const SKELETON_ROW_COUNT: number = 5

// One insight in its own card: skeleton while loading, error with retry, empty state, or the data.
// Each section has its own query, so one failing never hides the others.
export function InsightSection<T>({
  title,
  query,
  isEmpty,
  children,
  control,
  skeleton,
}: IInsightSectionProps<T>): React.JSX.Element {
  const titleId: string = useId()
  const { data, error, refetch } = query

  const handleRetry: () => void = useCallback((): void => {
    void refetch()
  }, [refetch])

  function renderContent(): React.ReactNode {
    if (error) {
      return (
        <ErrorState actionLabel={TRY_AGAIN_LABEL} message={error.error} title={INSIGHT_LOAD_ERROR_TITLE} onAction={handleRetry} />
      )
    }
    if (data === undefined) return skeleton ?? <TableSkeleton label={INSIGHT_LOADING_LABEL} rowCount={SKELETON_ROW_COUNT} />
    if (isEmpty(data)) return <EmptyState message={INSIGHTS_EMPTY_MESSAGE} title={INSIGHTS_EMPTY_TITLE} />
    return children(data)
  }

  return (
    <Paper withBorder aria-labelledby={titleId} component="section" p="lg">
      <Stack gap="md">
        <Group align="flex-end" justify="space-between">
          <Title id={titleId} order={2}>{title}</Title>
          {control}
        </Group>
        {renderContent()}
      </Stack>
    </Paper>
  )
}
