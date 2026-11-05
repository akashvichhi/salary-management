interface IApiEndpoints {
  employees:          string
  employeeById:       (id: number) => string
  employeeOptions:    string
  payrollOverview:    string
  salaryByCountry:    string
  salaryByJobTitle:   string
  salaryByDepartment: string
  login:              string
  logout:             string
  currentUser:        string
}

export const API_ENDPOINTS: IApiEndpoints = {
  employees:          'api/v1/employees',
  employeeById:       (id: number): string => `api/v1/employees/${id}`,
  employeeOptions:    'api/v1/employee-options',
  payrollOverview:    'api/v1/salary-insights/overview',
  salaryByCountry:    'api/v1/salary-insights/by-country',
  salaryByJobTitle:   'api/v1/salary-insights/by-job-title',
  salaryByDepartment: 'api/v1/salary-insights/by-department',
  login:              'api/v1/auth/login',
  logout:             'api/v1/auth/logout',
  currentUser:        'api/v1/auth/me',
}
