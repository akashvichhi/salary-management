import type { IEmployee } from '@src/types/employee'
import type { IPaginatedResponse, IPaginationMeta } from '@src/types/pagination'

export function buildEmployee(overrides: Partial<IEmployee> = {}): IEmployee {
  return {
    id:         1,
    fullName:   'Asha Rao',
    email:      'asha.rao@acme.com',
    jobTitle:   'Accountant',
    department: 'Finance',
    country:    'IN',
    salary:     '85000.00',
    currency:   'INR',
    hireDate:   '2024-03-15',
    createdAt:  '2024-03-15T10:00:00+05:30',
    updatedAt:  '2024-03-15T10:00:00+05:30',
    ...overrides,
  }
}

export function buildPage(
  employees: IEmployee[],
  meta: Partial<IPaginationMeta> = {},
): IPaginatedResponse<IEmployee> {
  return {
    data: employees,
    meta: { totalCount: employees.length, currentPage: 1, perPage: 20, totalPages: employees.length ? 1 : 0, ...meta },
  }
}
