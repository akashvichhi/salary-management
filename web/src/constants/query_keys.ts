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
