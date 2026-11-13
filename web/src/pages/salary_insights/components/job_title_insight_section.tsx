import { Select } from '@mantine/core'

import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  AVERAGE_SALARY_LABEL,
  BY_JOB_TITLE_TITLE,
  COUNTRY_PICKER_LABEL,
  HEADCOUNT_LABEL,
} from '@src/constants/salary_insight_messages'
import { InsightSection } from '@src/pages/salary_insights/components/insight_section'
import { InsightTable } from '@src/pages/salary_insights/components/insight_table'
import type { IInsightColumn } from '@src/pages/salary_insights/components/insight_table'
import { useInsightCountry } from '@src/pages/salary_insights/hooks/use_insight_country'
import { useEmployeeOptionsQuery } from '@src/queries/employee_queries'
import { useSalaryByJobTitleQuery } from '@src/queries/salary_insight_queries'
import type { IJobTitleSalaryInsight } from '@src/types/salary_insight'
import { formatCount } from '@src/utils/format_count'
import { formatCurrency } from '@src/utils/format_currency'
import { isEmptyList } from '@src/utils/is_empty_list'

const JOB_TITLE_COLUMNS: IInsightColumn<IJobTitleSalaryInsight>[] = [
  { label: EMPLOYEE_COLUMN_LABELS.jobTitle, render: (row: IJobTitleSalaryInsight): string => row.jobTitle },
  { label: HEADCOUNT_LABEL, render: (row: IJobTitleSalaryInsight): string => formatCount(row.headcount), isNumeric: true },
  {
    label:     AVERAGE_SALARY_LABEL,
    render:    (row: IJobTitleSalaryInsight): string => formatCurrency(row.averageSalary, row.currency),
    isNumeric: true,
  },
]

function jobTitleKey(row: IJobTitleSalaryInsight): string {
  return row.jobTitle
}

export function JobTitleInsightSection(): React.JSX.Element {
  const optionsQuery: ReturnType<typeof useEmployeeOptionsQuery> = useEmployeeOptionsQuery()
  const { data: options } = optionsQuery
  const { country, setCountry } = useInsightCountry(options?.countryCodes)
  const byJobTitleQuery: ReturnType<typeof useSalaryByJobTitleQuery> = useSalaryByJobTitleQuery(country)

  const countryPicker: React.JSX.Element = (
    <Select
      allowDeselect={false}
      data={options?.countries ?? []}
      disabled={options === undefined}
      label={COUNTRY_PICKER_LABEL}
      value={country}
      onChange={setCountry}
    />
  )

  return (
    <InsightSection
      control={countryPicker}
      isEmpty={isEmptyList}
      query={byJobTitleQuery}
      requires={optionsQuery}
      title={BY_JOB_TITLE_TITLE}
    >
      {(rows: IJobTitleSalaryInsight[]): React.JSX.Element => (
        <InsightTable columns={JOB_TITLE_COLUMNS} rowKey={jobTitleKey} rows={rows} />
      )}
    </InsightSection>
  )
}
