import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEmployeeOptions, getEmployees } from '@src/api/employee_api'
import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  CLEAR_FILTERS_LABEL,
  EMPLOYEES_EMPTY_TITLE,
  EMPLOYEES_FILTERED_EMPTY_TITLE,
  EMPLOYEES_LOAD_ERROR_TITLE,
  EMPLOYEES_LOADING_LABEL,
  EMPLOYEES_UPDATING_LABEL,
  RESET_SORT_LABEL,
  ROWS_PER_PAGE_LABEL,
  SEARCH_LABEL,
} from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import EmployeeListPage from '@src/pages/employee_list/employee_list_page'
import { buildEmployee, buildPage } from '@src/test_utils/employee_factory'
import { buildEmployeeOptions } from '@src/test_utils/employee_options_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import type { IEmployee, IEmployeeListParams } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'

vi.mock('@src/api/employee_api')

const getEmployeesMock: ReturnType<typeof vi.mocked<typeof getEmployees>> = vi.mocked(getEmployees)

// The debounced search fires after SEARCH_DEBOUNCE_MS; under a loaded test run the re-render can
// take longer than waitFor's 1 s default, so wait a little longer.
const DEBOUNCED_SEARCH_TIMEOUT_MS: number = 3_000

interface IFilterCase {
  label:  string
  option: string
  param:  Partial<IEmployeeListParams>
}

function neverResolves(): Promise<IPaginatedResponse<IEmployee>> {
  return new Promise((): void => {})
}

beforeEach((): void => {
  getEmployeesMock.mockReset()
  vi.mocked(getEmployeeOptions).mockResolvedValue(buildEmployeeOptions())
})

describe('EmployeeListPage', (): void => {
  it('shows a table skeleton while the first page loads', (): void => {
    getEmployeesMock.mockImplementation(neverResolves)

    renderWithProviders(<EmployeeListPage />)

    expect(screen.getByText(EMPLOYEES_LOADING_LABEL)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders a row per employee, with salary in USD and the country name', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2 }))

    renderWithProviders(<EmployeeListPage />)

    const row: HTMLElement = (await screen.findByText('Asha Rao')).closest('tr') as HTMLElement
    expect(within(row).getByText('asha.rao@acme.com')).toBeInTheDocument()
    expect(within(row).getByText('Accountant')).toBeInTheDocument()
    expect(within(row).getByText('Finance')).toBeInTheDocument()
    expect(within(row).getByText('India')).toBeInTheDocument()
    expect(within(row).getByText('$85,000.00')).toBeInTheDocument()
    expect(within(row).getByText('15/03/2024')).toBeInTheDocument()
    expect(screen.getByText('25 employees')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 20 }))
  })

  it('requests page 2 and keeps the current rows visible while it loads', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValueOnce(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2 }))
    getEmployeesMock.mockImplementationOnce(neverResolves)
    renderWithProviders(<EmployeeListPage />)
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, perPage: 20 }))
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(await screen.findByText(EMPLOYEES_UPDATING_LABEL)).toBeInTheDocument()
    expect(screen.queryByText(EMPLOYEES_LOADING_LABEL)).not.toBeInTheDocument()
  })

  it('shows the API error with a retry button, and retrying loads the rows', async (): Promise<void> => {
    getEmployeesMock.mockRejectedValueOnce({ error: 'Something went wrong. Please try again later.' })
    getEmployeesMock.mockResolvedValueOnce(buildPage([buildEmployee()]))
    renderWithProviders(<EmployeeListPage />)

    expect(await screen.findByRole('heading', { name: EMPLOYEES_LOAD_ERROR_TITLE })).toBeInTheDocument()
    expect(screen.getByText('Something went wrong. Please try again later.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
  })

  it('shows the empty state when there are no employees', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([]))

    renderWithProviders(<EmployeeListPage />)

    expect(await screen.findByRole('heading', { name: EMPLOYEES_EMPTY_TITLE })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('reads the list state from the URL, so refreshing keeps the view', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))

    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2&country=IN&sort=-salary' })

    await screen.findByText('Asha Rao')
    expect(getEmployeesMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, perPage: 20, country: 'IN', sort: '-salary' }),
    )
  })

  it('steps back to the last page when the current page is past the end', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValueOnce(buildPage([], { totalCount: 25, totalPages: 2, currentPage: 3 }))
    getEmployeesMock.mockResolvedValueOnce(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))

    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=3' })

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('requests the chosen page size, starting again from page 1', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2' })
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('combobox', { name: ROWS_PER_PAGE_LABEL }))
    fireEvent.click(await screen.findByRole('option', { name: '50' }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, perPage: 50 }))
  })

  it('searches by name or email once the user stops typing, from page 1', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2' })
    await screen.findByText('Asha Rao')
    const searchInput: HTMLElement = screen.getByRole('searchbox', { name: SEARCH_LABEL })

    fireEvent.change(searchInput, { target: { value: 'as' } })
    fireEvent.change(searchInput, { target: { value: ' asha ' } })

    await waitFor((): void => {
      expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'asha', page: 1 }))
    }, { timeout: DEBOUNCED_SEARCH_TIMEOUT_MS })
    expect(getEmployeesMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'as' }))
  })

  it('shows the search from the URL in the search box', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))

    renderWithProviders(<EmployeeListPage />, { route: '/employees?search=rao' })

    expect(await screen.findByRole('searchbox', { name: SEARCH_LABEL })).toHaveValue('rao')
    expect(getEmployeesMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'rao' }))
  })

  it.each<IFilterCase>([
    { label: EMPLOYEE_COLUMN_LABELS.country, option: 'India', param: { country: 'IN' } },
    { label: EMPLOYEE_COLUMN_LABELS.jobTitle, option: 'Accountant', param: { jobTitle: 'Accountant' } },
    { label: EMPLOYEE_COLUMN_LABELS.department, option: 'Finance', param: { department: 'Finance' } },
  ])('filters by $label, from page 1', async ({ label, option, param }: IFilterCase): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2' })
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('combobox', { name: label }))
    fireEvent.click(await screen.findByRole('option', { name: option }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ ...param, page: 1 }))
  })

  it('shows the filters from the URL in the filter inputs', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))

    renderWithProviders(<EmployeeListPage />, { route: '/employees?country=IN&department=Finance' })

    expect(await screen.findByRole('combobox', { name: EMPLOYEE_COLUMN_LABELS.country })).toHaveValue('India')
    expect(screen.getByRole('combobox', { name: EMPLOYEE_COLUMN_LABELS.department })).toHaveValue('Finance')
  })

  it('shows a "no match" state when filters hide everyone, and clearing them keeps the sort', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValueOnce(buildPage([]))
    getEmployeesMock.mockResolvedValueOnce(buildPage([buildEmployee()]))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?country=IN&search=zzz&sort=-salary' })

    expect(await screen.findByRole('heading', { name: EMPLOYEES_FILTERED_EMPTY_TITLE })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: CLEAR_FILTERS_LABEL }))

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ country: undefined, search: undefined, sort: '-salary', page: 1 }),
    )
    expect(screen.getByRole('searchbox', { name: SEARCH_LABEL })).toHaveValue('')
  })

  it('marks the table as sorted by name, ascending, by default', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))

    renderWithProviders(<EmployeeListPage />)

    expect(await screen.findByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.fullName }))
      .toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.salary })).toHaveAttribute('aria-sort', 'none')
  })

  it('sorts by a column on click, then reverses it on a second click, from page 1', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2' })
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('button', { name: EMPLOYEE_COLUMN_LABELS.salary }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'salary', page: 1 }))
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.salary })).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(screen.getByRole('button', { name: EMPLOYEE_COLUMN_LABELS.salary }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: '-salary' }))
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.salary })).toHaveAttribute('aria-sort', 'descending')
  })

  it('shows a descending sort from the URL on its column', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))

    renderWithProviders(<EmployeeListPage />, { route: '/employees?sort=-hire_date' })

    expect(await screen.findByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.hireDate }))
      .toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.fullName })).toHaveAttribute('aria-sort', 'none')
  })

  it('clears the sort on a third click, back to name A to Z', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?sort=-salary' })
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('button', { name: EMPLOYEE_COLUMN_LABELS.salary }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'full_name' }))
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.salary })).toHaveAttribute('aria-sort', 'none')
    expect(screen.getByRole('columnheader', { name: EMPLOYEE_COLUMN_LABELS.fullName })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('shows a reset sort button only while a sort is applied, and it goes back to the default', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()], { totalCount: 25, totalPages: 2, currentPage: 2 }))
    renderWithProviders(<EmployeeListPage />, { route: '/employees?page=2&sort=-hire_date' })
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('button', { name: RESET_SORT_LABEL }))

    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'full_name', page: 1 }))
    expect(screen.queryByRole('button', { name: RESET_SORT_LABEL })).not.toBeInTheDocument()
  })
})
