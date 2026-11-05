import type { IPaginationParams } from '@src/types/pagination'

interface IEmployeeKeys {
  all:   () => readonly ['employees']
  lists: () => readonly ['employees', 'list']
  list:  (params: IPaginationParams) => readonly ['employees', 'list', IPaginationParams]
}

// Every query key in the app, one factory per resource, so invalidation always matches.
export const employeeKeys: IEmployeeKeys = {
  all:   () => ['employees'] as const,
  lists: () => [...employeeKeys.all(), 'list'] as const,
  list:  (params: IPaginationParams) => [...employeeKeys.lists(), params] as const,
}
