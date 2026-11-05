import type { FormValidateInput } from '@mantine/form'

import { PASSWORD_REQUIRED_MESSAGE } from '@src/constants/auth_messages'
import type { ILoginFormValues } from '@src/types/auth'
import { validateEmail } from '@src/validations/employee_form_validation'

// Not trimmed: spaces are part of a password.
function validatePassword(value: string): string | null {
  return value ? null : PASSWORD_REQUIRED_MESSAGE
}

export const loginFormValidation: FormValidateInput<ILoginFormValues> = {
  email:    validateEmail,
  password: validatePassword,
}
