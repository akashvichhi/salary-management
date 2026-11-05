import type { IEmployeeListParams } from '@src/types/employee'

interface IEmployeeKeys {
  all:     () => readonly ['employees']
  lists:   () => readonly ['employees', 'list']
  list:    (params: IEmployeeListParams) => readonly ['employees', 'list', IEmployeeListParams]
  options: () => readonly ['employees', 'options']
}

// Every query key in the app, one factory per resource, so invalidation always matches.
export const employeeKeys: IEmployeeKeys = {
  all:     () => ['employees'] as const,
  lists:   () => [...employeeKeys.all(), 'list'] as const,
  list:    (params: IEmployeeListParams) => [...employeeKeys.lists(), params] as const,
  options: () => [...employeeKeys.all(), 'options'] as const,
}

interface ISalaryInsightKeys {
  all:          () => readonly ['salary-insights']
  overview:     () => readonly ['salary-insights', 'overview']
  byCountry:    () => readonly ['salary-insights', 'by-country']
  byJobTitle:   (country: string) => readonly ['salary-insights', 'by-job-title', string]
  byDepartment: () => readonly ['salary-insights', 'by-department']
}

export const salaryInsightKeys: ISalaryInsightKeys = {
  all:          () => ['salary-insights'] as const,
  overview:     () => [...salaryInsightKeys.all(), 'overview'] as const,
  byCountry:    () => [...salaryInsightKeys.all(), 'by-country'] as const,
  byJobTitle:   (country: string) => [...salaryInsightKeys.all(), 'by-job-title', country] as const,
  byDepartment: () => [...salaryInsightKeys.all(), 'by-department'] as const,
}

interface IAuthKeys {
  all:         () => readonly ['auth']
  currentUser: () => readonly ['auth', 'current-user']
}

export const authKeys: IAuthKeys = {
  all:         () => ['auth'] as const,
  currentUser: () => [...authKeys.all(), 'current-user'] as const,
}
