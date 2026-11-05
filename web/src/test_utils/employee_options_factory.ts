import type { IEmployeeOptions } from '@src/types/employee'

// A short version of GET /employee-options: just the values the tests pick or show.
export function buildEmployeeOptions(overrides: Partial<IEmployeeOptions> = {}): IEmployeeOptions {
  return {
    countries: [
      { code: 'IN', name: 'India' },
      { code: 'US', name: 'United States' },
    ],
    departments: ['Engineering', 'Finance'],
    jobTitles:   ['Accountant', 'Software Engineer'],
    ...overrides,
  }
}
