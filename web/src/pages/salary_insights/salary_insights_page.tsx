import { Stack, Text } from '@mantine/core'

import { SALARY_INSIGHTS_PAGE_TITLE } from '@src/constants/navigation_constants'
import { CURRENCY_NOTE } from '@src/constants/salary_insight_messages'
import { CountryInsightSection } from '@src/pages/salary_insights/components/country_insight_section'
import { DepartmentInsightSection } from '@src/pages/salary_insights/components/department_insight_section'
import { JobTitleInsightSection } from '@src/pages/salary_insights/components/job_title_insight_section'
import { PayrollOverviewSection } from '@src/pages/salary_insights/components/payroll_overview_section'
import { PageHeader } from '@src/ui/layout/page_header'

export default function SalaryInsightsPage(): React.JSX.Element {
  return (
    <Stack gap="lg">
      <PageHeader title={SALARY_INSIGHTS_PAGE_TITLE} />
      <Text c="dimmed">{CURRENCY_NOTE}</Text>
      <PayrollOverviewSection />
      <CountryInsightSection />
      <JobTitleInsightSection />
      <DepartmentInsightSection />
    </Stack>
  )
}
