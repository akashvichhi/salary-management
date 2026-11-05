import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEmployeeOptions } from '@src/api/employee_api'
import {
  getPayrollOverview,
  getSalaryByCountry,
  getSalaryByDepartment,
  getSalaryByJobTitle,
} from '@src/api/salary_insight_api'
import { NETWORK_ERROR_MESSAGE, TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import {
  BY_COUNTRY_TITLE,
  BY_DEPARTMENT_TITLE,
  BY_JOB_TITLE_TITLE,
  COUNTRY_PICKER_LABEL,
  INSIGHT_LOAD_ERROR_TITLE,
  INSIGHT_LOADING_LABEL,
  INSIGHTS_EMPTY_TITLE,
  OVERVIEW_TITLE,
  TOTAL_PAYROLL_LABEL,
} from '@src/constants/salary_insight_messages'
import SalaryInsightsPage from '@src/pages/salary_insights/salary_insights_page'
import { buildEmployeeOptions } from '@src/test_utils/employee_options_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import {
  buildCountryInsight,
  buildDepartmentInsight,
  buildJobTitleInsight,
  buildPayrollOverview,
} from '@src/test_utils/salary_insight_factory'
import type { IDepartmentSalaryInsight } from '@src/types/salary_insight'

vi.mock('@src/api/employee_api')
vi.mock('@src/api/salary_insight_api')

const getSalaryByJobTitleMock: ReturnType<typeof vi.mocked<typeof getSalaryByJobTitle>> = vi.mocked(getSalaryByJobTitle)
const getSalaryByDepartmentMock: ReturnType<typeof vi.mocked<typeof getSalaryByDepartment>> = vi.mocked(getSalaryByDepartment)

function section(title: string): HTMLElement {
  return screen.getByRole('region', { name: title })
}

function neverResolves(): Promise<IDepartmentSalaryInsight[]> {
  return new Promise((): void => {})
}

function rowOf(container: HTMLElement, text: string): HTMLElement {
  return within(container).getByText(text).closest('tr') as HTMLElement
}

beforeEach((): void => {
  vi.resetAllMocks()
  vi.mocked(getEmployeeOptions).mockResolvedValue(buildEmployeeOptions())
  vi.mocked(getPayrollOverview).mockResolvedValue(buildPayrollOverview())
  vi.mocked(getSalaryByCountry).mockResolvedValue([buildCountryInsight()])
  getSalaryByJobTitleMock.mockResolvedValue([buildJobTitleInsight()])
  getSalaryByDepartmentMock.mockResolvedValue([buildDepartmentInsight()])
})

describe('SalaryInsightsPage', (): void => {
  it('shows the headcount, the total payroll and the payroll per country', async (): Promise<void> => {
    renderWithProviders(<SalaryInsightsPage />)

    const overview: HTMLElement = await screen.findByRole('region', { name: OVERVIEW_TITLE })
    expect(await within(overview).findByText('10,000')).toBeInTheDocument()
    expect(within(overview).getByText(TOTAL_PAYROLL_LABEL)).toBeInTheDocument()
    expect(within(overview).getByText('$987,654,321.50')).toBeInTheDocument()
    const row: HTMLElement = rowOf(overview, 'India')
    expect(within(row).getByText('4,000')).toBeInTheDocument()
    expect(within(row).getByText('$120,000,000.25')).toBeInTheDocument()
  })

  it('shows min, max, average and median pay per country, as the API sends them', async (): Promise<void> => {
    renderWithProviders(<SalaryInsightsPage />)

    const byCountry: HTMLElement = await screen.findByRole('region', { name: BY_COUNTRY_TITLE })
    await within(byCountry).findByText('India')
    const row: HTMLElement = rowOf(byCountry, 'India')
    expect(within(row).getByText('$20,000.00')).toBeInTheDocument()
    expect(within(row).getByText('$250,000.00')).toBeInTheDocument()
    expect(within(row).getByText('$85,000.50')).toBeInTheDocument()
    expect(within(row).getByText('$80,000.00')).toBeInTheDocument()
  })

  it('shows average pay per job title in the first country, and in the one picked', async (): Promise<void> => {
    renderWithProviders(<SalaryInsightsPage />)

    const byJobTitle: HTMLElement = await screen.findByRole('region', { name: BY_JOB_TITLE_TITLE })
    const row: HTMLElement = (await within(byJobTitle).findByText('Accountant')).closest('tr') as HTMLElement
    expect(within(row).getByText('$70,000.00')).toBeInTheDocument()
    expect(getSalaryByJobTitleMock).toHaveBeenCalledWith('IN')

    getSalaryByJobTitleMock.mockResolvedValue([buildJobTitleInsight({ jobTitle: 'Software Engineer' })])
    fireEvent.click(within(byJobTitle).getByRole('combobox', { name: COUNTRY_PICKER_LABEL }))
    fireEvent.click(await screen.findByRole('option', { name: 'United States' }))

    expect(await within(byJobTitle).findByText('Software Engineer')).toBeInTheDocument()
    expect(getSalaryByJobTitleMock).toHaveBeenLastCalledWith('US')
  })

  it('reads the picked country from the URL, so refreshing keeps it', async (): Promise<void> => {
    renderWithProviders(<SalaryInsightsPage />, { route: '/salary-insights?country=US' })

    const byJobTitle: HTMLElement = await screen.findByRole('region', { name: BY_JOB_TITLE_TITLE })
    expect(await within(byJobTitle).findByRole('combobox', { name: COUNTRY_PICKER_LABEL })).toHaveValue('United States')
    await waitFor((): void => {
      expect(getSalaryByJobTitleMock).toHaveBeenCalledWith('US')
    })
  })

  it('shows average pay per department', async (): Promise<void> => {
    renderWithProviders(<SalaryInsightsPage />)

    const byDepartment: HTMLElement = await screen.findByRole('region', { name: BY_DEPARTMENT_TITLE })
    const row: HTMLElement = (await within(byDepartment).findByText('Finance')).closest('tr') as HTMLElement
    expect(within(row).getByText('900')).toBeInTheDocument()
    expect(within(row).getByText('$91,000.75')).toBeInTheDocument()
  })

  it('shows a skeleton in a section while it loads, without holding back the others', async (): Promise<void> => {
    getSalaryByDepartmentMock.mockImplementation(neverResolves)
    renderWithProviders(<SalaryInsightsPage />)

    expect(await within(await screen.findByRole('region', { name: BY_COUNTRY_TITLE })).findByText('India')).toBeInTheDocument()
    expect(within(section(BY_DEPARTMENT_TITLE)).getByText(INSIGHT_LOADING_LABEL)).toBeInTheDocument()
  })

  it('shows an error with a retry button in the section that failed only', async (): Promise<void> => {
    getSalaryByDepartmentMock.mockRejectedValueOnce({ error: 'Something went wrong. Please try again later.' })
    renderWithProviders(<SalaryInsightsPage />)

    const byDepartment: HTMLElement = await screen.findByRole('region', { name: BY_DEPARTMENT_TITLE })
    expect(await within(byDepartment).findByRole('heading', { name: INSIGHT_LOAD_ERROR_TITLE })).toBeInTheDocument()
    expect(within(section(BY_COUNTRY_TITLE)).queryByRole('heading', { name: INSIGHT_LOAD_ERROR_TITLE })).not.toBeInTheDocument()

    fireEvent.click(within(byDepartment).getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(await within(byDepartment).findByText('Finance')).toBeInTheDocument()
  })

  it('shows an empty state in a section with no employees', async (): Promise<void> => {
    vi.mocked(getSalaryByCountry).mockResolvedValue([])
    renderWithProviders(<SalaryInsightsPage />)

    const byCountry: HTMLElement = await screen.findByRole('region', { name: BY_COUNTRY_TITLE })
    expect(await within(byCountry).findByRole('heading', { name: INSIGHTS_EMPTY_TITLE })).toBeInTheDocument()
  })

  it('shows an error with a retry in the job-title section when the country list fails', async (): Promise<void> => {
    vi.mocked(getEmployeeOptions).mockRejectedValueOnce({ error: NETWORK_ERROR_MESSAGE })
    renderWithProviders(<SalaryInsightsPage />)

    const byJobTitle: HTMLElement = await screen.findByRole('region', { name: BY_JOB_TITLE_TITLE })
    expect(await within(byJobTitle).findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument()
    expect(getSalaryByJobTitleMock).not.toHaveBeenCalled()

    fireEvent.click(within(byJobTitle).getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(await within(byJobTitle).findByText(buildJobTitleInsight().jobTitle)).toBeInTheDocument()
  })
})
