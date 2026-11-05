import { useCallback } from 'react'

import { useEmployeeOptionsQuery } from '@src/queries/employee_queries'

// Turns a country code into the name the API lists for it, or the code itself while the list loads.
export function useCountryName(): (code: string) => string {
  const { data } = useEmployeeOptionsQuery()

  return useCallback((code: string): string => data?.countryNameByCode.get(code) ?? code, [data])
}
