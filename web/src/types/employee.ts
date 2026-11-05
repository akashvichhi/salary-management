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

// What the form holds: a Select or the date picker is null until something is chosen.
export interface IEmployeeFormValues {
  fullName:   string
  email:      string
  jobTitle:   string | null
  department: string | null
  country:    string | null
  salary:     string
  hireDate:   string | null
}

// GET /employee-options: the allowed values of the fields picked from a list.
export interface ICountryOption {
  code: string
  name: string
}

export interface IEmployeeOptions {
  countries:   ICountryOption[]
  departments: string[]
  jobTitles:   string[]
}

export interface ISelectOption {
  value: string
  label: string
}

// The same lists, shaped for the dropdowns and the table.
export interface IEmployeeSelectOptions {
  countries:         ISelectOption[]
  departments:       string[]
  jobTitles:         string[]
  countryCodes:      string[]
  countryNameByCode: ReadonlyMap<string, string>
}
