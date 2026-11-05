import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEmployees } from '@src/api/employee_api'
import {
  EMPLOYEES_EMPTY_TITLE,
  EMPLOYEES_LOAD_ERROR_TITLE,
  EMPLOYEES_LOADING_LABEL,
  EMPLOYEES_UPDATING_LABEL,
  ROWS_PER_PAGE_LABEL,
  SEARCH_LABEL,
} from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import EmployeeListPage from '@src/pages/employee_list/employee_list_page'
import { buildEmployee, buildPage } from '@src/test_utils/employee_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse } from '@src/types/pagination'

vi.mock('@src/api/employee_api')

const getEmployeesMock: ReturnType<typeof vi.mocked<typeof getEmployees>> = vi.mocked(getEmployees)

// The debounced search fires after SEARCH_DEBOUNCE_MS; under a loaded test run the re-render can
// take longer than waitFor's 1 s default, so wait a little longer.
const DEBOUNCED_SEARCH_TIMEOUT_MS: number = 3_000

function neverResolves(): Promise<IPaginatedResponse<IEmployee>> {
  return new Promise((): void => {})
}

beforeEach((): void => {
  getEmployeesMock.mockReset()
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
    expect(within(row).getByText('Mar 15, 2024')).toBeInTheDocument()
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
})
