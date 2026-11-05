import type { ComboboxItem } from '@mantine/core'

import type { TEmployeeColumn } from '@src/types/employee'

// Copies of the fixed lists in api/app/constants/employee_constants.py (decision 21).
// Change both together; the API still validates every value.
export const COUNTRY_OPTIONS: readonly ComboboxItem[] = [
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'IN', label: 'India' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
]

export const COUNTRY_CODES: readonly string[] = COUNTRY_OPTIONS.map((option: ComboboxItem): string => option.value)

export const COUNTRY_NAME_BY_CODE: ReadonlyMap<string, string> = new Map(
  COUNTRY_OPTIONS.map((option: ComboboxItem): [string, string] => [option.value, option.label]),
)

export const DEPARTMENTS: readonly string[] = [
  'Customer Support',
  'Design',
  'Engineering',
  'Finance',
  'Human Resources',
  'Legal',
  'Marketing',
  'Operations',
  'Product',
  'Sales',
]

export const JOB_TITLES: readonly string[] = [
  'Account Manager',
  'Accountant',
  'Content Writer',
  'Data Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'Engineering Manager',
  'Financial Analyst',
  'HR Generalist',
  'Legal Counsel',
  'Marketing Specialist',
  'Operations Manager',
  'Product Designer',
  'Product Manager',
  'QA Engineer',
  'Recruiter',
  'Sales Executive',
  'Senior Software Engineer',
  'Software Engineer',
  'Support Specialist',
]

export const DEFAULT_PAGE: number = 1
export const DEFAULT_PER_PAGE: number = 20

export const EMPLOYEE_COLUMN_LABELS: Readonly<Record<TEmployeeColumn, string>> = {
  fullName:   'Name',
  email:      'Email',
  jobTitle:   'Job title',
  department: 'Department',
  country:    'Country',
  salary:     'Salary',
  hireDate:   'Hire date',
}

export const PER_PAGE_OPTIONS: readonly number[] = [10, 20, 50, 100]

// Sent to the API as values, so they stay in snake_case (the case converter only touches keys).
export const EMPLOYEE_SORT_FIELDS: Readonly<Record<TEmployeeColumn, string>> = {
  fullName:   'full_name',
  email:      'email',
  jobTitle:   'job_title',
  department: 'department',
  country:    'country',
  salary:     'salary',
  hireDate:   'hire_date',
}
export const DEFAULT_EMPLOYEE_SORT: string = EMPLOYEE_SORT_FIELDS.fullName

// Long enough to skip the keystrokes of a word being typed, short enough to feel instant.
export const SEARCH_DEBOUNCE_MS: number = 300

// Taller pages scroll inside the table (with the header kept in view), so the pagination and
// page-size controls below it stay on screen.
export const EMPLOYEE_TABLE_MAX_HEIGHT: number = 560

// The API's limits for an employee (api/app/constants/employee_constants.py). The form checks them
// first for quick feedback; the API stays the source of truth.
export const FULL_NAME_MAX_LENGTH: number = 100
// Numeric(12, 2): up to 10 digits before the decimal point and 2 after.
export const SALARY_PATTERN: RegExp = /^\d{1,10}(\.\d{1,2})?$/
export const NON_ZERO_DIGIT_PATTERN: RegExp = /[1-9]/
export const EMAIL_PATTERN: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
