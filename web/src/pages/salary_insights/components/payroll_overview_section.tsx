import { useMemo } from 'react'

import { Paper, SimpleGrid, Stack, Text } from '@mantine/core'

import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  HEADCOUNT_LABEL,
  INSIGHT_LOADING_LABEL,
  OVERVIEW_TITLE,
  PAYROLL_LABEL,
  TOTAL_PAYROLL_LABEL,
} from '@src/constants/salary_insight_messages'
import { InsightSection } from '@src/pages/salary_insights/components/insight_section'
import { InsightTable } from '@src/pages/salary_insights/components/insight_table'
import type { IInsightColumn } from '@src/pages/salary_insights/components/insight_table'
import { useCountryName } from '@src/pages/salary_insights/hooks/use_country_name'
import { usePayrollOverviewQuery } from '@src/queries/salary_insight_queries'
import type { ICountryPayroll, IPayrollOverview } from '@src/types/salary_insight'
import { CardSkeleton } from '@src/ui/skeletons/card_skeleton'
import { formatCount } from '@src/utils/format_count'
import { formatCurrency } from '@src/utils/format_currency'

interface IStatCardProps {
  label: string
  value: string
}

const STAT_CARD_COUNT: number = 2
const STAT_GRID_COLUMNS: { base: number, sm: number } = { base: 1, sm: 2 }

function StatCard({ label, value }: IStatCardProps): React.JSX.Element {
  return (
    <Paper withBorder p="md">
      <Text c="dimmed" size="sm">{label}</Text>
      <Text fw="bold" size="xl">{value}</Text>
    </Paper>
  )
}

function isEmptyOverview(overview: IPayrollOverview): boolean {
  return overview.headcount === 0
}

function countryPayrollKey(row: ICountryPayroll): string {
  return row.country
}

export function PayrollOverviewSection(): React.JSX.Element {
  const overviewQuery: ReturnType<typeof usePayrollOverviewQuery> = usePayrollOverviewQuery()
  const countryName: (code: string) => string = useCountryName()

  const columns: IInsightColumn<ICountryPayroll>[] = useMemo<IInsightColumn<ICountryPayroll>[]>(
    (): IInsightColumn<ICountryPayroll>[] => [
      { label: EMPLOYEE_COLUMN_LABELS.country, render: (row: ICountryPayroll): string => countryName(row.country) },
      { label: HEADCOUNT_LABEL, render: (row: ICountryPayroll): string => formatCount(row.headcount), isNumeric: true },
      { label: PAYROLL_LABEL, render: (row: ICountryPayroll): string => formatCurrency(row.totalPayroll), isNumeric: true },
    ],
    [countryName],
  )

  return (
    <InsightSection
      isEmpty={isEmptyOverview}
      query={overviewQuery}
      skeleton={<CardSkeleton cardCount={STAT_CARD_COUNT} label={INSIGHT_LOADING_LABEL} />}
      title={OVERVIEW_TITLE}
    >
      {(overview: IPayrollOverview): React.JSX.Element => (
        <Stack gap="md">
          <SimpleGrid cols={STAT_GRID_COLUMNS} spacing="md">
            <StatCard label={HEADCOUNT_LABEL} value={formatCount(overview.headcount)} />
            <StatCard label={TOTAL_PAYROLL_LABEL} value={formatCurrency(overview.totalPayroll)} />
          </SimpleGrid>
          <InsightTable columns={columns} rowKey={countryPayrollKey} rows={overview.payrollByCountry} />
        </Stack>
      )}
    </InsightSection>
  )
}
