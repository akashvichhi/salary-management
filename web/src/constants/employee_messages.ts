export const EMPLOYEES_LOADING_LABEL: string = 'Loading employees'
export const EMPLOYEES_UPDATING_LABEL: string = 'Updating employees'
export const EMPLOYEES_LOAD_ERROR_TITLE: string = 'Employees could not be loaded'
export const EMPLOYEE_OPTIONS_LOAD_ERROR_TITLE: string = 'The employee lists could not be loaded'
export const EMPLOYEES_EMPTY_TITLE: string = 'No employees yet'
export const EMPLOYEES_EMPTY_MESSAGE: string = 'Employees you add will appear here.'

export function employeeCountLabel(count: number, formattedCount: string): string {
  return count === 1 ? `${formattedCount} employee` : `${formattedCount} employees`
}
export const ROWS_PER_PAGE_LABEL: string = 'Rows per page'
export const SEARCH_LABEL: string = 'Search'
export const SEARCH_PLACEHOLDER: string = 'Name or email'
export const EMPLOYEES_FILTERED_EMPTY_TITLE: string = 'No employees match these filters'
export const EMPLOYEES_FILTERED_EMPTY_MESSAGE: string = 'Try a different search, or clear the filters to see everyone.'
export const CLEAR_FILTERS_LABEL: string = 'Clear filters'
export const RESET_SORT_LABEL: string = 'Reset sort'
export const SALARY_SORT_HINT: string = 'Sorts by the salary in USD, so amounts in different currencies compare fairly'

export const ADD_EMPLOYEE_LABEL: string = 'Add employee'
export const EDIT_EMPLOYEE_TITLE: string = 'Edit employee'
export const SAVE_EMPLOYEE_LABEL: string = 'Save'
export const CANCEL_LABEL: string = 'Cancel'
export const EMPLOYEE_ACTIONS_LABEL: string = 'Actions'

export function editEmployeeLabel(fullName: string): string {
  return `Edit ${fullName}`
}

export const EMPLOYEE_CREATED_MESSAGE: string = 'Employee added'
export const EMPLOYEE_UPDATED_MESSAGE: string = 'Employee updated'
export const EMPLOYEE_DELETED_MESSAGE: string = 'Employee deleted'

export const DELETE_EMPLOYEE_TITLE: string = 'Delete employee'
export const DELETE_LABEL: string = 'Delete'

export function deleteEmployeeLabel(fullName: string): string {
  return `Delete ${fullName}`
}

export function deleteEmployeeConfirmMessage(fullName: string): string {
  return `Delete ${fullName}? They will no longer appear in the employee list or the salary insights.`
}

export const FULL_NAME_REQUIRED_MESSAGE: string = 'Enter the employee’s name'
export const FULL_NAME_TOO_LONG_MESSAGE: string = 'Name must be at most 100 characters'
export const EMAIL_INVALID_MESSAGE: string = 'Enter a valid email address'
export const JOB_TITLE_REQUIRED_MESSAGE: string = 'Choose a job title'
export const DEPARTMENT_REQUIRED_MESSAGE: string = 'Choose a department'
export const COUNTRY_REQUIRED_MESSAGE: string = 'Choose a country'
export const SALARY_INVALID_MESSAGE: string = 'Enter an amount greater than 0, with at most 2 decimals'
export const SALARY_CURRENCY_HINT: string = 'Choose a country first: the salary is in its currency'

export function salaryCurrencyDescription(currency: string): string {
  return `In ${currency}, the currency of the employee’s country`
}
export const HIRE_DATE_REQUIRED_MESSAGE: string = 'Enter the hire date'
