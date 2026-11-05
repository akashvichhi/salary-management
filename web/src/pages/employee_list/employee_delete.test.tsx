import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteEmployee, getEmployees } from '@src/api/employee_api'
import {
  CANCEL_LABEL,
  DELETE_EMPLOYEE_TITLE,
  DELETE_LABEL,
  deleteEmployeeConfirmMessage,
  deleteEmployeeLabel,
  EMPLOYEE_DELETED_MESSAGE,
} from '@src/constants/employee_messages'
import EmployeeListPage from '@src/pages/employee_list/employee_list_page'
import { buildEmployee, buildPage } from '@src/test_utils/employee_factory'
import { renderWithProviders } from '@src/test_utils/render_with_providers'

vi.mock('@src/api/employee_api')

const getEmployeesMock: ReturnType<typeof vi.mocked<typeof getEmployees>> = vi.mocked(getEmployees)
const deleteEmployeeMock: ReturnType<typeof vi.mocked<typeof deleteEmployee>> = vi.mocked(deleteEmployee)

function neverResolves(): Promise<void> {
  return new Promise((): void => {})
}

async function openDeleteModal(route?: string): Promise<HTMLElement> {
  renderWithProviders(<EmployeeListPage />, { route })
  fireEvent.click(await screen.findByRole('button', { name: deleteEmployeeLabel('Asha Rao') }))
  return screen.findByRole('dialog', { name: DELETE_EMPLOYEE_TITLE })
}

function confirmButton(dialog: HTMLElement): HTMLElement {
  return within(dialog).getByRole('button', { name: DELETE_LABEL })
}

beforeEach((): void => {
  vi.resetAllMocks()
  modals.closeAll()
  notifications.clean()
  getEmployeesMock.mockResolvedValue(buildPage([buildEmployee()]))
})

describe('deleting an employee', (): void => {
  it('asks first, naming the employee', async (): Promise<void> => {
    const dialog: HTMLElement = await openDeleteModal()

    expect(within(dialog).getByText(deleteEmployeeConfirmMessage('Asha Rao'))).toBeInTheDocument()
    expect(deleteEmployeeMock).not.toHaveBeenCalled()
  })

  it('does nothing when cancelled', async (): Promise<void> => {
    const dialog: HTMLElement = await openDeleteModal()

    fireEvent.click(within(dialog).getByRole('button', { name: CANCEL_LABEL }))

    await waitFor((): void => {
      expect(screen.queryByRole('dialog', { name: DELETE_EMPLOYEE_TITLE })).not.toBeInTheDocument()
    })
    expect(deleteEmployeeMock).not.toHaveBeenCalled()
  })

  it('deletes on confirm, says so, closes the modal and reloads the list', async (): Promise<void> => {
    deleteEmployeeMock.mockResolvedValue()
    const dialog: HTMLElement = await openDeleteModal()

    fireEvent.click(confirmButton(dialog))

    expect(await screen.findByText(EMPLOYEE_DELETED_MESSAGE)).toBeInTheDocument()
    expect(deleteEmployeeMock).toHaveBeenCalledWith(1)
    await waitFor((): void => {
      expect(screen.queryByRole('dialog', { name: DELETE_EMPLOYEE_TITLE })).not.toBeInTheDocument()
    })
    expect(getEmployeesMock).toHaveBeenCalledTimes(2)
  })

  it('disables the confirm button while the delete runs', async (): Promise<void> => {
    deleteEmployeeMock.mockImplementation(neverResolves)
    const dialog: HTMLElement = await openDeleteModal()

    fireEvent.click(confirmButton(dialog))

    await waitFor((): void => {
      expect(confirmButton(dialog)).toBeDisabled()
    })
  })

  it('shows the API error as a notification, and keeps the modal open', async (): Promise<void> => {
    deleteEmployeeMock.mockRejectedValue({ error: 'Employee not found' })
    const dialog: HTMLElement = await openDeleteModal()

    fireEvent.click(confirmButton(dialog))

    expect(await screen.findByText('Employee not found')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: DELETE_EMPLOYEE_TITLE })).toBeInTheDocument()
  })

  it('steps back a page after deleting the only employee on the last page', async (): Promise<void> => {
    getEmployeesMock.mockResolvedValueOnce(buildPage([buildEmployee()], { totalCount: 21, totalPages: 2, currentPage: 2 }))
    getEmployeesMock.mockResolvedValueOnce(buildPage([], { totalCount: 20, totalPages: 1, currentPage: 2 }))
    getEmployeesMock.mockResolvedValue(buildPage([buildEmployee({ id: 5, fullName: 'Meera Iyer' })], { totalCount: 20 }))
    deleteEmployeeMock.mockResolvedValue()
    const dialog: HTMLElement = await openDeleteModal('/employees?page=2')

    fireEvent.click(confirmButton(dialog))

    expect(await screen.findByText('Meera Iyer')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })
})
