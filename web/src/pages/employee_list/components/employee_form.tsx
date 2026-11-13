import { Button, Group, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'

import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import { CANCEL_LABEL, SALARY_CURRENCY_HINT, salaryCurrencyDescription, SAVE_EMPLOYEE_LABEL } from '@src/constants/employee_messages'
import { useEmployeeForm } from '@src/pages/employee_list/hooks/use_employee_form'
import type { IEmployee, IEmployeeSelectOptions } from '@src/types/employee'

interface IEmployeeFormProps {
  // null to add an employee.
  employee: IEmployee | null
  options:  IEmployeeSelectOptions
  onDone:   () => void
}

const FORM_COLUMNS: { base: number, sm: number } = { base: 1, sm: 2 }

// The salary is in the country's currency, so the field names it once a country is chosen.
function salaryDescription(country: string | null, currencyByCountry: ReadonlyMap<string, string>): string {
  const currency: string | undefined = country === null ? undefined : currencyByCountry.get(country)
  return currency === undefined ? SALARY_CURRENCY_HINT : salaryCurrencyDescription(currency)
}

export function EmployeeForm({ employee, options, onDone }: IEmployeeFormProps): React.JSX.Element {
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
            data={options.jobTitles}
            label={EMPLOYEE_COLUMN_LABELS.jobTitle}
            {...form.getInputProps('jobTitle')}
          />
          <Select
            searchable
            withAsterisk
            data={options.departments}
            label={EMPLOYEE_COLUMN_LABELS.department}
            {...form.getInputProps('department')}
          />
          <Select
            searchable
            withAsterisk
            data={options.countries}
            label={EMPLOYEE_COLUMN_LABELS.country}
            {...form.getInputProps('country')}
          />
          <TextInput
            withAsterisk
            description={salaryDescription(form.values.country, options.currencyByCountry)}
            inputMode="decimal"
            label={EMPLOYEE_COLUMN_LABELS.salary}
            {...form.getInputProps('salary')}
          />
          {/* Mantine 9 gives the date as a "YYYY-MM-DD" string, the shape the API takes, with no time zone. */}
          <DatePickerInput
            withAsterisk
            label={EMPLOYEE_COLUMN_LABELS.hireDate}
            {...form.getInputProps('hireDate')}
          />
        </SimpleGrid>
        <Group gap="sm" justify="flex-end">
          <Button disabled={isSaving} variant="default" onClick={onDone}>{CANCEL_LABEL}</Button>
          <Button loading={isSaving} type="submit">{SAVE_EMPLOYEE_LABEL}</Button>
        </Group>
      </Stack>
    </form>
  )
}
