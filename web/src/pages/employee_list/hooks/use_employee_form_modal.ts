import { useCallback, useState } from 'react'

import type { IEmployee } from '@src/types/employee'

interface IEmployeeFormModal {
  opened:     boolean
  // null while adding; the employee being edited otherwise.
  employee:   IEmployee | null
  // Changes on every open, so the form starts fresh each time.
  formKey:    number
  openCreate: () => void
  openEdit:   (employee: IEmployee) => void
  close:      () => void
}

interface IModalState {
  opened:   boolean
  employee: IEmployee | null
  formKey:  number
}

const CLOSED: IModalState = { opened: false, employee: null, formKey: 0 }

// Which employee the add/edit modal shows. Closing keeps the employee, so the title and the form
// don't change while the modal fades out.
export function useEmployeeFormModal(): IEmployeeFormModal {
  const [state, setState] = useState<IModalState>(CLOSED)

  const open: (employee: IEmployee | null) => void = useCallback((employee: IEmployee | null): void => {
    setState((current: IModalState): IModalState => ({ opened: true, employee, formKey: current.formKey + 1 }))
  }, [])

  const openCreate: () => void = useCallback((): void => open(null), [open])
  const openEdit: (employee: IEmployee) => void = useCallback((employee: IEmployee): void => open(employee), [open])

  const close: () => void = useCallback((): void => {
    setState((current: IModalState): IModalState => ({ ...current, opened: false }))
  }, [])

  return { ...state, openCreate, openEdit, close }
}
