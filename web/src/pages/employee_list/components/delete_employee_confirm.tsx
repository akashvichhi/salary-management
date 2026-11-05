import { useCallback } from 'react'

import { Button, Group, Stack, Text } from '@mantine/core'

import { CANCEL_LABEL, DELETE_LABEL, deleteEmployeeConfirmMessage } from '@src/constants/employee_messages'
import { useDeleteEmployeeMutation } from '@src/queries/employee_queries'
import type { IEmployee } from '@src/types/employee'

interface IDeleteEmployeeConfirmProps {
  employee: IEmployee
  onClose:  () => void
}

// The confirmation modal's body. It runs the delete itself, so the confirm button can show the
// loading state; on failure the modal stays open and the notification explains why.
export function DeleteEmployeeConfirm({ employee, onClose }: IDeleteEmployeeConfirmProps): React.JSX.Element {
  const { mutate, isPending } = useDeleteEmployeeMutation()

  const handleConfirm: () => void = useCallback((): void => {
    mutate(employee.id, { onSuccess: onClose })
  }, [mutate, employee.id, onClose])

  return (
    <Stack gap="lg">
      <Text>{deleteEmployeeConfirmMessage(employee.fullName)}</Text>
      <Group gap="sm" justify="flex-end">
        <Button disabled={isPending} variant="default" onClick={onClose}>{CANCEL_LABEL}</Button>
        <Button color="red" loading={isPending} onClick={handleConfirm}>{DELETE_LABEL}</Button>
      </Group>
    </Stack>
  )
}
