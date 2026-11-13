import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import { AVERAGE_SALARY_USD_LABEL, BY_DEPARTMENT_TITLE, HEADCOUNT_LABEL } from '@src/constants/salary_insight_messages'
import { REPORTING_CURRENCY } from '@src/constants/time_constants'
import { InsightSection } from '@src/pages/salary_insights/components/insight_section'
import { InsightTable } from '@src/pages/salary_insights/components/insight_table'
import type { IInsightColumn } from '@src/pages/salary_insights/components/insight_table'
import { useSalaryByDepartmentQuery } from '@src/queries/salary_insight_queries'
import type { IDepartmentSalaryInsight } from '@src/types/salary_insight'
import { formatCount } from '@src/utils/format_count'
import { formatCurrency } from '@src/utils/format_currency'
import { isEmptyList } from '@src/utils/is_empty_list'

const DEPARTMENT_COLUMNS: IInsightColumn<IDepartmentSalaryInsight>[] = [
  { label: EMPLOYEE_COLUMN_LABELS.department, render: (row: IDepartmentSalaryInsight): string => row.department },
  { label: HEADCOUNT_LABEL, render: (row: IDepartmentSalaryInsight): string => formatCount(row.headcount), isNumeric: true },
  {
    label:     AVERAGE_SALARY_USD_LABEL,
    render:    (row: IDepartmentSalaryInsight): string => formatCurrency(row.averageSalaryUsd, REPORTING_CURRENCY),
    isNumeric: true,
  },
]

function departmentKey(row: IDepartmentSalaryInsight): string {
  return row.department
}

export function DepartmentInsightSection(): React.JSX.Element {
  const byDepartmentQuery: ReturnType<typeof useSalaryByDepartmentQuery> = useSalaryByDepartmentQuery()

  return (
    <InsightSection isEmpty={isEmptyList} query={byDepartmentQuery} title={BY_DEPARTMENT_TITLE}>
      {(rows: IDepartmentSalaryInsight[]): React.JSX.Element => (
        <InsightTable columns={DEPARTMENT_COLUMNS} rowKey={departmentKey} rows={rows} />
      )}
    </InsightSection>
  )
}
