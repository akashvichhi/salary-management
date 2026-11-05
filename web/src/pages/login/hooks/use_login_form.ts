import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useForm } from '@mantine/form'
import type { UseFormReturnType } from '@mantine/form'

import { useLoginMutation } from '@src/queries/auth_queries'
import type { ILoginFormValues } from '@src/types/auth'
import { pathAfterLogin } from '@src/utils/login_redirect'
import { loginFormValidation } from '@src/validations/login_form_validation'

interface ILoginFormState {
  form:         UseFormReturnType<ILoginFormValues>
  isLoggingIn:  boolean
  // The API's own message: the same for a wrong email and a wrong password.
  loginError:   string | null
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => void
}

const EMPTY_CREDENTIALS: ILoginFormValues = { email: '', password: '' }

export function useLoginForm(): ILoginFormState {
  const navigate: ReturnType<typeof useNavigate> = useNavigate()
  const location: ReturnType<typeof useLocation> = useLocation()
  const { mutate, isPending, error } = useLoginMutation()

  const form: UseFormReturnType<ILoginFormValues> = useForm<ILoginFormValues>({
    mode:          'controlled',
    initialValues: EMPTY_CREDENTIALS,
    validate:      loginFormValidation,
  })

  const logIn: (values: ILoginFormValues) => void = useCallback((values: ILoginFormValues): void => {
    mutate({ email: values.email.trim(), password: values.password }, {
      onSuccess: (): void => {
        void navigate(pathAfterLogin(location.state), { replace: true })
      },
    })
  }, [mutate, navigate, location.state])

  return {
    form,
    isLoggingIn:  isPending,
    loginError:   error?.error ?? null,
    handleSubmit: form.onSubmit(logIn),
  }
}
