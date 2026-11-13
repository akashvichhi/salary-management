import { useMemo } from 'react'

import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  AVERAGE_SALARY_LABEL,
  AVERAGE_SALARY_USD_LABEL,
  BY_COUNTRY_TITLE,
  HEADCOUNT_LABEL,
  MAX_SALARY_LABEL,
  MEDIAN_SALARY_LABEL,
  MIN_SALARY_LABEL,
} from '@src/constants/salary_insight_messages'
import { REPORTING_CURRENCY } from '@src/constants/time_constants'
import { InsightSection } from '@src/pages/salary_insights/components/insight_section'
import { InsightTable } from '@src/pages/salary_insights/components/insight_table'
import type { IInsightColumn } from '@src/pages/salary_insights/components/insight_table'
import { useCountryName } from '@src/pages/salary_insights/hooks/use_country_name'
import { useSalaryByCountryQuery } from '@src/queries/salary_insight_queries'
import type { ICountrySalaryInsight } from '@src/types/salary_insight'
import { formatCount } from '@src/utils/format_count'
import { formatCurrency } from '@src/utils/format_currency'
import { isEmptyList } from '@src/utils/is_empty_list'

function countryKey(row: ICountrySalaryInsight): string {
  return row.country
}

export function CountryInsightSection(): React.JSX.Element {
  const byCountryQuery: ReturnType<typeof useSalaryByCountryQuery> = useSalaryByCountryQuery()
  const countryName: (code: string) => string = useCountryName()

  const columns: IInsightColumn<ICountrySalaryInsight>[] = useMemo<IInsightColumn<ICountrySalaryInsight>[]>(
    (): IInsightColumn<ICountrySalaryInsight>[] => [
      { label: EMPLOYEE_COLUMN_LABELS.country, render: (row: ICountrySalaryInsight): string => countryName(row.country) },
      { label: HEADCOUNT_LABEL, render: (row: ICountrySalaryInsight): string => formatCount(row.headcount), isNumeric: true },
      { label: MIN_SALARY_LABEL, render: (row: ICountrySalaryInsight): string => formatCurrency(row.minSalary, row.currency), isNumeric: true },
      { label: MAX_SALARY_LABEL, render: (row: ICountrySalaryInsight): string => formatCurrency(row.maxSalary, row.currency), isNumeric: true },
      {
        label:     AVERAGE_SALARY_LABEL,
        render:    (row: ICountrySalaryInsight): string => formatCurrency(row.averageSalary, row.currency),
        isNumeric: true,
      },
      {
        label:     MEDIAN_SALARY_LABEL,
        render:    (row: ICountrySalaryInsight): string => formatCurrency(row.medianSalary, row.currency),
        isNumeric: true,
      },
      {
        label:     AVERAGE_SALARY_USD_LABEL,
        render:    (row: ICountrySalaryInsight): string => formatCurrency(row.averageSalaryUsd, REPORTING_CURRENCY),
        isNumeric: true,
      },
    ],
    [countryName],
  )

  return (
    <InsightSection isEmpty={isEmptyList} query={byCountryQuery} title={BY_COUNTRY_TITLE}>
      {(rows: ICountrySalaryInsight[]): React.JSX.Element => (
        <InsightTable columns={columns} rowKey={countryKey} rows={rows} />
      )}
    </InsightSection>
  )
}
