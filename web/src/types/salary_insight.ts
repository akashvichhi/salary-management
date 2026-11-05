// Every amount is a decimal string ("85000.00") computed by the API: the page only formats it.

export interface ICountrySalaryInsight {
  country:       string
  headcount:     number
  minSalary:     string
  maxSalary:     string
  averageSalary: string
  medianSalary:  string
}

export interface IJobTitleSalaryInsight {
  jobTitle:      string
  headcount:     number
  averageSalary: string
}

export interface IDepartmentSalaryInsight {
  department:    string
  headcount:     number
  averageSalary: string
}

export interface ICountryPayroll {
  country:      string
  headcount:    number
  totalPayroll: string
}

export interface IPayrollOverview {
  headcount:        number
  totalPayroll:     string
  payrollByCountry: ICountryPayroll[]
}
