import type { FormValidateInput } from '@mantine/form'

import {
  EMAIL_PATTERN,
  FULL_NAME_MAX_LENGTH,
  NON_ZERO_DIGIT_PATTERN,
  SALARY_PATTERN,
} from '@src/constants/employee_constants'
import {
  COUNTRY_REQUIRED_MESSAGE,
  DEPARTMENT_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  FULL_NAME_REQUIRED_MESSAGE,
  FULL_NAME_TOO_LONG_MESSAGE,
  HIRE_DATE_REQUIRED_MESSAGE,
  JOB_TITLE_REQUIRED_MESSAGE,
  SALARY_INVALID_MESSAGE,
} from '@src/constants/employee_messages'
import type { IEmployeeFormValues } from '@src/types/employee'

type TFieldRule = (value: string | null) => string | null

function required(message: string): TFieldRule {
  return (value: string | null): string | null => (value?.trim() ? null : message)
}

function validateFullName(value: string | null): string | null {
  const fullName: string = value?.trim() ?? ''
  if (!fullName) return FULL_NAME_REQUIRED_MESSAGE
  return fullName.length > FULL_NAME_MAX_LENGTH ? FULL_NAME_TOO_LONG_MESSAGE : null
}

export function validateEmail(value: string | null): string | null {
  return EMAIL_PATTERN.test(value?.trim() ?? '') ? null : EMAIL_INVALID_MESSAGE
}

// Checked as text, so the amount is never parsed into a float.
function validateSalary(value: string | null): string | null {
  const salary: string = value?.trim() ?? ''
  return SALARY_PATTERN.test(salary) && NON_ZERO_DIGIT_PATTERN.test(salary) ? null : SALARY_INVALID_MESSAGE
}

// For quick feedback only: the API checks every rule again.
export const employeeFormValidation: FormValidateInput<IEmployeeFormValues> = {
  fullName:   validateFullName,
  email:      validateEmail,
  jobTitle:   required(JOB_TITLE_REQUIRED_MESSAGE),
  department: required(DEPARTMENT_REQUIRED_MESSAGE),
  country:    required(COUNTRY_REQUIRED_MESSAGE),
  salary:     validateSalary,
  hireDate:   required(HIRE_DATE_REQUIRED_MESSAGE),
}
