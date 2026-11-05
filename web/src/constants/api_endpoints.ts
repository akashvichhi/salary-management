interface IApiEndpoints {
  employees:    string
  employeeById: (id: number) => string
}

export const API_ENDPOINTS: IApiEndpoints = {
  employees:    'api/v1/employees',
  employeeById: (id: number): string => `api/v1/employees/${id}`,
}
