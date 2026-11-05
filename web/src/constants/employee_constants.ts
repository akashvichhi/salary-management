import type { ComboboxItem } from '@mantine/core'

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

export const EMPLOYEE_COLUMN_LABELS: Readonly<Record<'fullName' | 'email' | 'jobTitle' | 'department' | 'country' | 'salary' | 'hireDate', string>> = {
  fullName:   'Name',
  email:      'Email',
  jobTitle:   'Job title',
  department: 'Department',
  country:    'Country',
  salary:     'Salary',
  hireDate:   'Hire date',
}
