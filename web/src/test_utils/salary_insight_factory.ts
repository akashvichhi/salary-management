import type {
  ICountrySalaryInsight,
  IDepartmentSalaryInsight,
  IJobTitleSalaryInsight,
  IPayrollOverview,
} from '@src/types/salary_insight'

export function buildPayrollOverview(overrides: Partial<IPayrollOverview> = {}): IPayrollOverview {
  return {
    headcount:        10000,
    totalPayroll:     '987654321.50',
    payrollByCountry: [{ country: 'IN', headcount: 4000, totalPayroll: '120000000.25' }],
    ...overrides,
  }
}

export function buildCountryInsight(overrides: Partial<ICountrySalaryInsight> = {}): ICountrySalaryInsight {
  return {
    country:       'IN',
    headcount:     4000,
    minSalary:     '20000.00',
    maxSalary:     '250000.00',
    averageSalary: '85000.50',
    medianSalary:  '80000.00',
    ...overrides,
  }
}

export function buildJobTitleInsight(overrides: Partial<IJobTitleSalaryInsight> = {}): IJobTitleSalaryInsight {
  return { jobTitle: 'Accountant', headcount: 120, averageSalary: '70000.00', ...overrides }
}

export function buildDepartmentInsight(overrides: Partial<IDepartmentSalaryInsight> = {}): IDepartmentSalaryInsight {
  return { department: 'Finance', headcount: 900, averageSalary: '91000.75', ...overrides }
}
