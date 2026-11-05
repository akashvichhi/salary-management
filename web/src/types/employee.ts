import type { IPaginationParams } from '@src/types/pagination'

export interface IEmployee {
  id:         number
  fullName:   string
  email:      string
  jobTitle:   string
  department: string
  country:    string
  // A decimal string ("85000.00"): money is never parsed into a number.
  salary:     string
  hireDate:   string
  createdAt:  string
  updatedAt:  string
}

export type TEmployeeFilterKey = 'country' | 'jobTitle' | 'department'

export interface IEmployeeListParams extends IPaginationParams {
  sort:        string
  search?:     string
  country?:    string
  jobTitle?:   string
  department?: string
}

export type TEmployeeColumn = 'fullName' | 'email' | 'jobTitle' | 'department' | 'country' | 'salary' | 'hireDate'

// The body of POST /employees. Salary stays a decimal string, so it is never parsed into a float.
export interface IEmployeeCreatePayload {
  fullName:   string
  email:      string
  jobTitle:   string
  department: string
  country:    string
  salary:     string
  hireDate:   string
}

// The body of PATCH /employees/{id}: only the fields that changed.
export type TEmployeeUpdatePayload = Partial<IEmployeeCreatePayload>
