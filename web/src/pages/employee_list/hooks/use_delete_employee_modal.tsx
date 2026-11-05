import { useCallback } from 'react'

import { modals } from '@mantine/modals'

import { DELETE_EMPLOYEE_TITLE } from '@src/constants/employee_messages'
import { DeleteEmployeeConfirm } from '@src/pages/employee_list/components/delete_employee_confirm'
import type { IEmployee } from '@src/types/employee'

// Delete always asks first: opens the confirmation modal naming the employee.
export function useDeleteEmployeeModal(): (employee: IEmployee) => void {
  return useCallback((employee: IEmployee): void => {
    const modalId: string = modals.open({
      title:    DELETE_EMPLOYEE_TITLE,
      children: <DeleteEmployeeConfirm employee={employee} onClose={(): void => modals.close(modalId)} />,
    })
  }, [])
}
