export const EMPLOYEES_LOADING_LABEL: string = 'Loading employees'
export const EMPLOYEES_UPDATING_LABEL: string = 'Updating employees'
export const EMPLOYEES_LOAD_ERROR_TITLE: string = 'Employees could not be loaded'
export const EMPLOYEES_EMPTY_TITLE: string = 'No employees yet'
export const EMPLOYEES_EMPTY_MESSAGE: string = 'Employees you add will appear here.'

export function employeeCountLabel(count: number, formattedCount: string): string {
  return count === 1 ? `${formattedCount} employee` : `${formattedCount} employees`
}
