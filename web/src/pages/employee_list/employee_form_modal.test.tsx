import { notifications } from '@mantine/notifications'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmployee, getEmployees, updateEmployee } from '@src/api/employee_api'
import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import {
  ADD_EMPLOYEE_LABEL,
  COUNTRY_REQUIRED_MESSAGE,
  DEPARTMENT_REQUIRED_MESSAGE,
  EDIT_EMPLOYEE_TITLE,
  editEmployeeLabel,
  EMAIL_INVALID_MESSAGE,
  EMPLOYEE_CREATED_MESSAGE,
  EMPLOYEE_UPDATED_MESSAGE,
  FULL_NAME_REQUIRED_MESSAGE,
  HIRE_DATE_REQUIRED_MESSAGE,
  JOB_TITLE_REQUIRED_MESSAGE,
  SALARY_INVALID_MESSAGE,
  SAVE_EMPLOYEE_LABEL,
} from '@src/constants/employee_messages'
import EmployeeListPage from '@src/pages/employee_list/employee_list_page'
import { buildEmployee, buildPage } from '@src/test_utils/employee_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'
import type { IEmployee, IEmployeeCreatePayload } from '@src/types/employee'

vi.mock('@src/api/employee_api')

const getEmployeesMock: ReturnType<typeof vi.mocked<typeof getEmployees>> = vi.mocked(getEmployees)
const createEmployeeMock: ReturnType<typeof vi.mocked<typeof createEmployee>> = vi.mocked(createEmployee)
const updateEmployeeMock: ReturnType<typeof vi.mocked<typeof updateEmployee>> = vi.mocked(updateEmployee)

const EMAIL_TAKEN_MESSAGE: string = 'An employee with this email already exists'
// Filling the form opens three Mantine Selects, which takes several seconds in jsdom.
const FORM_TEST_TIMEOUT_MS: number = 20_000
const NEW_EMPLOYEE: IEmployeeCreatePayload = {
  fullName:   'Ravi Kumar',
  email:      'ravi.kumar@acme.com',
  jobTitle:   'Software Engineer',
  department: 'Engineering',
  country:    'IN',
  salary:     '92000.50',
  hireDate:   '2025-01-06',
}

function neverResolves(): Promise<IEmployee> {
  return new Promise((): void => {})
}

function textbox(dialog: HTMLElement, label: string): HTMLElement {
  return within(dialog).getByRole('textbox', { name: label })
}

function saveButton(dialog: HTMLElement): HTMLElement {
  return within(dialog).getByRole('button', { name: SAVE_EMPLOYEE_LABEL })
}

async function openAddModal(): Promise<HTMLElement> {
  renderWithProviders(<EmployeeListPage />)
  await screen.findByText('Asha Rao')
  fireEvent.click(screen.getByRole('button', { name: ADD_EMPLOYEE_LABEL }))
  return screen.findByRole('dialog', { name: ADD_EMPLOYEE_LABEL })
}

async function openEditModal(): Promise<HTMLElement> {
  renderWithProviders(<EmployeeListPage />)
  fireEvent.click(await screen.findByRole('button', { name: editEmployeeLabel('Asha Rao') }))
  return screen.findByRole('dialog', { name: EDIT_EMPLOYEE_TITLE })
}

async function chooseOption(dialog: HTMLElement, label: string, option: string): Promise<void> {
  fireEvent.click(within(dialog).getByRole('combobox', { name: label }))
  fireEvent.click(await screen.findByRole('option', { name: option }))
}

async function fillNewEmployee(dialog: HTMLElement): Promise<void> {
  fireEvent.change(textbox(dialog, EMPLOYEE_COLUMN_LABELS.fullName), { target: { value: ` ${NEW_EMPLOYEE.fullName} ` } })
  fireEvent.change(textbox(dialog, EMPLOYEE_COLUMN_LABELS.email), { target: { value: NEW_EMPLOYEE.email } })
  await chooseOption(dialog, EMPLOYEE_COLUMN_LABELS.jobTitle, NEW_EMPLOYEE.jobTitle)
  await chooseOption(dialog, EMPLOYEE_COLUMN_LABELS.department, NEW_EMPLOYEE.department)
  await chooseOption(dialog, EMPLOYEE_COLUMN_LABELS.country, 'India')
  fireEvent.change(textbox(dialog, EMPLOYEE_COLUMN_LABELS.salary), { target: { value: NEW_EMPLOYEE.salary } })
  fireEvent.change(within(dialog).getByLabelText(EMPLOYEE_COLUMN_LABELS.hireDate, { exact: false }), {
    target: { value: NEW_EMPLOYEE.hireDate },
  })
}

beforeEach((): void => {
  vi.resetAllMocks()
  notifications.clean()
  getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))
})

describe('adding an employee', { timeout: FORM_TEST_TIMEOUT_MS }, (): void => {
  it('sends the form, confirms it, closes the modal and reloads the list', async (): Promise<void> => {
    createEmployeeMock.mockResolvedValue(buildEmployee({ id: 2, fullName: NEW_EMPLOYEE.fullName }))
    const dialog: HTMLElement = await openAddModal()

    await fillNewEmployee(dialog)
    fireEvent.click(saveButton(dialog))

    expect(await screen.findByText(EMPLOYEE_CREATED_MESSAGE)).toBeInTheDocument()
    expect(createEmployeeMock).toHaveBeenCalledWith(NEW_EMPLOYEE)
    await waitFor((): void => {
      expect(screen.queryByRole('dialog', { name: ADD_EMPLOYEE_LABEL })).not.toBeInTheDocument()
    })
    expect(getEmployeesMock).toHaveBeenCalledTimes(2)
  })

  it('shows what is missing and sends nothing when the form is empty', async (): Promise<void> => {
    const dialog: HTMLElement = await openAddModal()

    fireEvent.click(saveButton(dialog))

    const messages: string[] = [
      FULL_NAME_REQUIRED_MESSAGE,
      EMAIL_INVALID_MESSAGE,
      JOB_TITLE_REQUIRED_MESSAGE,
      DEPARTMENT_REQUIRED_MESSAGE,
      COUNTRY_REQUIRED_MESSAGE,
      SALARY_INVALID_MESSAGE,
      HIRE_DATE_REQUIRED_MESSAGE,
    ]
    for (const message of messages) {
      expect(await within(dialog).findByText(message)).toBeInTheDocument()
    }
    expect(createEmployeeMock).not.toHaveBeenCalled()
  })

  it.each(['0', '-5', '12.345', 'abc', '12345678901'])('rejects %s as a salary', async (salary: string): Promise<void> => {
    const dialog: HTMLElement = await openAddModal()
    await fillNewEmployee(dialog)

    fireEvent.change(textbox(dialog, EMPLOYEE_COLUMN_LABELS.salary), { target: { value: salary } })
    fireEvent.click(saveButton(dialog))

    expect(await within(dialog).findByText(SALARY_INVALID_MESSAGE)).toBeInTheDocument()
    expect(createEmployeeMock).not.toHaveBeenCalled()
  })

  it('shows a server error about one field on that input, and keeps the modal open', async (): Promise<void> => {
    createEmployeeMock.mockRejectedValue({
      error:   EMAIL_TAKEN_MESSAGE,
      details: [{ field: 'email', message: EMAIL_TAKEN_MESSAGE }],
    })
    const dialog: HTMLElement = await openAddModal()
    await fillNewEmployee(dialog)

    fireEvent.click(saveButton(dialog))

    await waitFor((): void => {
      expect(textbox(dialog, EMPLOYEE_COLUMN_LABELS.email)).toHaveAccessibleDescription(EMAIL_TAKEN_MESSAGE)
    })
    expect(screen.getByRole('dialog', { name: ADD_EMPLOYEE_LABEL })).toBeInTheDocument()
  })

  it('shows any other server error as a notification, and keeps the modal open', async (): Promise<void> => {
    createEmployeeMock.mockRejectedValue({ error: 'Could not reach the server.' })
    const dialog: HTMLElement = await openAddModal()
    await fillNewEmployee(dialog)

    fireEvent.click(saveButton(dialog))

    expect(await screen.findByText('Could not reach the server.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: ADD_EMPLOYEE_LABEL })).toBeInTheDocument()
  })

  it('disables the save button while the employee is being saved', async (): Promise<void> => {
    createEmployeeMock.mockImplementation(neverResolves)
    const dialog: HTMLElement = await openAddModal()
    await fillNewEmployee(dialog)

    fireEvent.click(saveButton(dialog))

    await waitFor((): void => {
      expect(saveButton(dialog)).toBeDisabled()
    })
  })
})

describe('editing an employee', { timeout: FORM_TEST_TIMEOUT_MS }, (): void => {
  it('opens the form filled in, and sends only the fields that changed', async (): Promise<void> => {
    updateEmployeeMock.mockResolvedValue(buildEmployee({ salary: '90000.00' }))
    const dialog: HTMLElement = await openEditModal()

    expect(textbox(dialog, EMPLOYEE_COLUMN_LABELS.fullName)).toHaveValue('Asha Rao')
    expect(within(dialog).getByRole('combobox', { name: EMPLOYEE_COLUMN_LABELS.country })).toHaveValue('India')
    expect(within(dialog).getByLabelText(EMPLOYEE_COLUMN_LABELS.hireDate, { exact: false })).toHaveValue('2024-03-15')
    expect(textbox(dialog, EMPLOYEE_COLUMN_LABELS.salary)).toHaveValue('85000.00')

    fireEvent.change(textbox(dialog, EMPLOYEE_COLUMN_LABELS.salary), { target: { value: '90000' } })
    fireEvent.click(saveButton(dialog))

    expect(await screen.findByText(EMPLOYEE_UPDATED_MESSAGE)).toBeInTheDocument()
    expect(updateEmployeeMock).toHaveBeenCalledWith(1, { salary: '90000' })
  })

  it('closes without a request when nothing changed', async (): Promise<void> => {
    const dialog: HTMLElement = await openEditModal()

    fireEvent.click(saveButton(dialog))

    await waitFor((): void => {
      expect(screen.queryByRole('dialog', { name: EDIT_EMPLOYEE_TITLE })).not.toBeInTheDocument()
    })
    expect(updateEmployeeMock).not.toHaveBeenCalled()
  })
})
