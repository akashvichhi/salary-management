// Every amount is a decimal string ("85000.00") computed by the API: the page only formats it.
// Figures for one country are in its own currency; figures that add up several countries, and every
// field ending in "Usd", are converted to USD by the API (decision 4).

export interface ICountrySalaryInsight {
  country:          string
  currency:         string
  headcount:        number
  minSalary:        string
  maxSalary:        string
  averageSalary:    string
  medianSalary:     string
  averageSalaryUsd: string
}

export interface IJobTitleSalaryInsight {
  jobTitle:      string
  currency:      string
  headcount:     number
  averageSalary: string
}

export interface IDepartmentSalaryInsight {
  department:       string
  headcount:        number
  averageSalaryUsd: string
}

export interface ICountryPayroll {
  country:         string
  currency:        string
  headcount:       number
  totalPayroll:    string
  totalPayrollUsd: string
}

export interface IPayrollOverview {
  headcount:        number
  totalPayrollUsd:  string
  payrollByCountry: ICountryPayroll[]
}
