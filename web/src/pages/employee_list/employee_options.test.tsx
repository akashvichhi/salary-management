import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEmployeeOptions, getEmployees } from '@src/api/employee_api'
import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  ADD_EMPLOYEE_LABEL,
  EMPLOYEE_OPTIONS_LOAD_ERROR_TITLE,
  EMPLOYEES_LOADING_LABEL,
} from '@src/constants/employee_messages'
import { TRY_AGAIN_LABEL } from '@src/constants/error_messages'
import EmployeeListPage from '@src/pages/employee_list/employee_list_page'
import { buildEmployee, buildPage } from '@src/test_utils/employee_factory'
import { buildEmployeeOptions } from '@src/test_utils/employee_options_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import type { IEmployeeOptions } from '@src/types/employee'

vi.mock('@src/api/employee_api')

const getEmployeesMock: ReturnType<typeof vi.mocked<typeof getEmployees>> = vi.mocked(getEmployees)
const getEmployeeOptionsMock: ReturnType<typeof vi.mocked<typeof getEmployeeOptions>> = vi.mocked(getEmployeeOptions)

// Values only the API knows about, so a copy kept in the web app could not pass these tests.
const API_OPTIONS: IEmployeeOptions = buildEmployeeOptions({
  countries:   [{ code: 'NZ', name: 'New Zealand', currency: 'NZD' }],
  departments: ['Research'],
  jobTitles:   ['Researcher'],
})

function neverResolves(): Promise<IEmployeeOptions> {
  return new Promise((): void => {})
}

async function optionNames(label: string, container: HTMLElement = document.body): Promise<string[]> {
  fireEvent.click(within(container).getByRole('combobox', { name: label }))
  const listbox: HTMLElement = await screen.findByRole('listbox')
  const names: string[] = within(listbox).getAllByRole('option').map((option: HTMLElement): string => option.textContent)
  fireEvent.keyDown(within(container).getByRole('combobox', { name: label }), { key: 'Escape' })
  return names
}

beforeEach((): void => {
  vi.resetAllMocks()
  getEmployeesMock.mockResolvedValue(buildPage([buildEmployee({ country: 'NZ', jobTitle: 'Researcher', department: 'Research' })]))
  getEmployeeOptionsMock.mockResolvedValue(API_OPTIONS)
})

describe('EmployeeListPage dropdown lists', (): void => {
  it('fills the filters with the lists the API serves', async (): Promise<void> => {
    renderWithProviders(<EmployeeListPage />)
    await screen.findByRole('table')

    expect(await optionNames(EMPLOYEE_COLUMN_LABELS.country)).toEqual(['New Zealand'])
    expect(await optionNames(EMPLOYEE_COLUMN_LABELS.jobTitle)).toEqual(['Researcher'])
    expect(await optionNames(EMPLOYEE_COLUMN_LABELS.department)).toEqual(['Research'])
    expect(getEmployeeOptionsMock).toHaveBeenCalledTimes(1)
  })

  it('shows the country name the API gives for a code', async (): Promise<void> => {
    renderWithProviders(<EmployeeListPage />)

    const row: HTMLElement = (await screen.findByText('Asha Rao')).closest('tr') as HTMLElement
    expect(within(row).getByText('New Zealand')).toBeInTheDocument()
  })

  it('fills the employee form with the same lists', async (): Promise<void> => {
    renderWithProviders(<EmployeeListPage />)
    await screen.findByText('Asha Rao')

    fireEvent.click(screen.getByRole('button', { name: ADD_EMPLOYEE_LABEL }))
    const dialog: HTMLElement = await screen.findByRole('dialog', { name: ADD_EMPLOYEE_LABEL })

    expect(await optionNames(EMPLOYEE_COLUMN_LABELS.jobTitle, dialog)).toEqual(['Researcher'])
  })

  it('keeps a filter from the URL only when the API lists its value', async (): Promise<void> => {
    renderWithProviders(<EmployeeListPage />, { route: '/employees?country=NZ&department=Finance' })

    expect(await screen.findByRole('combobox', { name: EMPLOYEE_COLUMN_LABELS.country })).toHaveValue('New Zealand')
    expect(getEmployeesMock).toHaveBeenCalledWith(expect.objectContaining({ country: 'NZ', department: undefined }))
  })

  it('waits for the lists before asking for employees, showing the table skeleton', (): void => {
    getEmployeeOptionsMock.mockImplementation(neverResolves)

    renderWithProviders(<EmployeeListPage />)

    expect(screen.getByText(EMPLOYEES_LOADING_LABEL)).toBeInTheDocument()
    expect(getEmployeesMock).not.toHaveBeenCalled()
  })

  it('shows an error with a retry button when the lists fail, and retrying loads the page', async (): Promise<void> => {
    getEmployeeOptionsMock.mockRejectedValueOnce({ error: 'Something went wrong. Please try again later.' })
    renderWithProviders(<EmployeeListPage />)

    expect(await screen.findByRole('heading', { name: EMPLOYEE_OPTIONS_LOAD_ERROR_TITLE })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN_LABEL }))

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
  })
})
