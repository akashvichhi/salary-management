import type {
  ICountrySalaryInsight,
  IDepartmentSalaryInsight,
  IJobTitleSalaryInsight,
  IPayrollOverview,
} from '@src/types/salary_insight'

export function buildPayrollOverview(overrides: Partial<IPayrollOverview> = {}): IPayrollOverview {
  return {
    headcount:        10000,
    totalPayrollUsd:  '987654321.50',
    payrollByCountry: [
      { country: 'IN', currency: 'INR', headcount: 4000, totalPayroll: '120000000.25', totalPayrollUsd: '1355932.21' },
    ],
    ...overrides,
  }
}

export function buildCountryInsight(overrides: Partial<ICountrySalaryInsight> = {}): ICountrySalaryInsight {
  return {
    country:          'IN',
    currency:         'INR',
    headcount:        4000,
    minSalary:        '20000.00',
    maxSalary:        '250000.00',
    averageSalary:    '85000.50',
    medianSalary:     '80000.00',
    averageSalaryUsd: '960.46',
    ...overrides,
  }
}

export function buildJobTitleInsight(overrides: Partial<IJobTitleSalaryInsight> = {}): IJobTitleSalaryInsight {
  return { jobTitle: 'Accountant', currency: 'INR', headcount: 120, averageSalary: '70000.00', ...overrides }
}

export function buildDepartmentInsight(overrides: Partial<IDepartmentSalaryInsight> = {}): IDepartmentSalaryInsight {
  return { department: 'Finance', headcount: 900, averageSalaryUsd: '91000.75', ...overrides }
}
