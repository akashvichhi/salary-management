import { Modal } from '@mantine/core'

import { ADD_EMPLOYEE_LABEL, EDIT_EMPLOYEE_TITLE } from '@src/constants/employee_messages'
import { EmployeeForm } from '@src/pages/employee_list/components/employee_form'
import type { IEmployee } from '@src/types/employee'

interface IEmployeeFormModalProps {
  opened:   boolean
  employee: IEmployee | null
  formKey:  number
  onClose:  () => void
}

export function EmployeeFormModal({ opened, employee, formKey, onClose }: IEmployeeFormModalProps): React.JSX.Element {
  return (
    <Modal opened={opened} size="lg" title={employee ? EDIT_EMPLOYEE_TITLE : ADD_EMPLOYEE_LABEL} onClose={onClose}>
      <EmployeeForm key={formKey} employee={employee} onDone={onClose} />
    </Modal>
  )
}
