import { useCallback } from 'react'

import { useForm } from '@mantine/form'
import type { UseFormReturnType } from '@mantine/form'

import { useCreateEmployeeMutation, useUpdateEmployeeMutation } from '@src/queries/employee_queries'
import type { IApiError, IFieldError } from '@src/types/api_response'
import type { IEmployee, IEmployeeCreatePayload, IEmployeeFormValues, TEmployeeUpdatePayload } from '@src/types/employee'
import { employeeFormValidation } from '@src/validations/employee_form_validation'

type TEmployeeForm = UseFormReturnType<IEmployeeFormValues, IEmployeeCreatePayload>

interface IEmployeeFormState {
  form:         TEmployeeForm
  isSaving:     boolean
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => void
}

const EMPTY_FORM_VALUES: IEmployeeFormValues = {
  fullName:   '',
  email:      '',
  jobTitle:   null,
  department: null,
  country:    null,
  salary:     '',
  // null, not '': the date picker would show an empty string as "Invalid date".
  hireDate:   null,
}

function toFormValues(employee: IEmployee): IEmployeeFormValues {
  const { fullName, email, jobTitle, department, country, salary, hireDate } = employee
  return { fullName, email, jobTitle, department, country, salary, hireDate }
}

// Runs after validation, so every Select and the date picker already hold a value.
function toPayload(values: IEmployeeFormValues): IEmployeeCreatePayload {
  return {
    fullName:   values.fullName.trim(),
    email:      values.email.trim(),
    jobTitle:   values.jobTitle ?? '',
    department: values.department ?? '',
    country:    values.country ?? '',
    salary:     values.salary.trim(),
    hireDate:   values.hireDate ?? '',
  }
}

// PATCH sends only what changed, so an edit never rewrites fields the user didn't touch.
function changedFields(payload: IEmployeeCreatePayload, employee: IEmployee): TEmployeeUpdatePayload {
  const original: IEmployeeCreatePayload = toPayload(toFormValues(employee))
  const keys: (keyof IEmployeeCreatePayload)[] = Object.keys(payload) as (keyof IEmployeeCreatePayload)[]
  return Object.fromEntries(
    keys.filter((key: keyof IEmployeeCreatePayload): boolean => payload[key] !== original[key])
      .map((key: keyof IEmployeeCreatePayload): [string, string] => [key, payload[key]]),
  )
}

/**
 * The add/edit form: client-side checks first, then the API. Server errors about one field
 * (e.g. a taken email) are shown on that input; the mutation hooks show the notifications.
 */
export function useEmployeeForm(employee: IEmployee | null, onDone: () => void): IEmployeeFormState {
  const createMutation: ReturnType<typeof useCreateEmployeeMutation> = useCreateEmployeeMutation()
  const updateMutation: ReturnType<typeof useUpdateEmployeeMutation> = useUpdateEmployeeMutation()

  const form: TEmployeeForm = useForm<IEmployeeFormValues, IEmployeeCreatePayload>({
    mode:            'controlled',
    initialValues:   employee ? toFormValues(employee) : EMPTY_FORM_VALUES,
    validate:        employeeFormValidation,
    transformValues: toPayload,
  })
  const { setFieldError } = form

  const showFieldErrors: (error: IApiError) => void = useCallback((error: IApiError): void => {
    error.details?.forEach((detail: IFieldError): void => setFieldError(detail.field, detail.message))
  }, [setFieldError])

  const save: (payload: IEmployeeCreatePayload) => void = useCallback((payload: IEmployeeCreatePayload): void => {
    const callbacks: { onSuccess: () => void, onError: (error: IApiError) => void } = { onSuccess: onDone, onError: showFieldErrors }
    if (!employee) {
      createMutation.mutate(payload, callbacks)
      return
    }
    const changes: TEmployeeUpdatePayload = changedFields(payload, employee)
    if (Object.keys(changes).length === 0) {
      onDone()
      return
    }
    updateMutation.mutate({ id: employee.id, payload: changes }, callbacks)
  }, [employee, onDone, showFieldErrors, createMutation, updateMutation])

  return {
    form,
    isSaving:     createMutation.isPending || updateMutation.isPending,
    handleSubmit: form.onSubmit(save),
  }
}
