import { Button, Group, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import type { ComboboxData } from '@mantine/core'

import { COUNTRY_OPTIONS, DEPARTMENTS, EMPLOYEE_COLUMN_LABELS, JOB_TITLES } from '@src/constants/employee_constants'
import { CANCEL_LABEL, SAVE_EMPLOYEE_LABEL } from '@src/constants/employee_messages'
import { useEmployeeForm } from '@src/pages/employee_list/hooks/use_employee_form'
import type { IEmployee } from '@src/types/employee'

interface IEmployeeFormProps {
  // null to add an employee.
  employee: IEmployee | null
  onDone:   () => void
}

const CURRENCY_SYMBOL: string = '$'
const FORM_COLUMNS: { base: number, sm: number } = { base: 1, sm: 2 }

export function EmployeeForm({ employee, onDone }: IEmployeeFormProps): React.JSX.Element {
  const { form, isSaving, handleSubmit } = useEmployeeForm(employee, onDone)

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Stack gap="md">
        <SimpleGrid cols={FORM_COLUMNS} spacing="md">
          <TextInput withAsterisk label={EMPLOYEE_COLUMN_LABELS.fullName} {...form.getInputProps('fullName')} />
          <TextInput withAsterisk label={EMPLOYEE_COLUMN_LABELS.email} type="email" {...form.getInputProps('email')} />
          <Select
            searchable
            withAsterisk
            data={JOB_TITLES as ComboboxData}
            label={EMPLOYEE_COLUMN_LABELS.jobTitle}
            {...form.getInputProps('jobTitle')}
          />
          <Select
            searchable
            withAsterisk
            data={DEPARTMENTS as ComboboxData}
            label={EMPLOYEE_COLUMN_LABELS.department}
            {...form.getInputProps('department')}
          />
          <Select
            searchable
            withAsterisk
            data={COUNTRY_OPTIONS as ComboboxData}
            label={EMPLOYEE_COLUMN_LABELS.country}
            {...form.getInputProps('country')}
          />
          <TextInput
            withAsterisk
            inputMode="decimal"
            label={EMPLOYEE_COLUMN_LABELS.salary}
            leftSection={CURRENCY_SYMBOL}
            {...form.getInputProps('salary')}
          />
          <TextInput withAsterisk label={EMPLOYEE_COLUMN_LABELS.hireDate} type="date" {...form.getInputProps('hireDate')} />
        </SimpleGrid>
        <Group gap="sm" justify="flex-end">
          <Button disabled={isSaving} variant="default" onClick={onDone}>{CANCEL_LABEL}</Button>
          <Button loading={isSaving} type="submit">{SAVE_EMPLOYEE_LABEL}</Button>
        </Group>
      </Stack>
    </form>
  )
}
