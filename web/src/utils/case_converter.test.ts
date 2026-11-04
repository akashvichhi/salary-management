import { describe, expect, it } from 'vitest'

import { keysToCamelCase, keysToSnakeCase, toCamelCase, toSnakeCase } from '@src/utils/case_converter'

describe('toCamelCase', (): void => {
  it.each([
    ['full_name', 'fullName'],
    ['total_count', 'totalCount'],
    ['average_salary_2024', 'averageSalary2024'],
    ['id', 'id'],
  ])('converts %s to %s', (input: string, expected: string): void => {
    expect(toCamelCase(input)).toBe(expected)
  })
})

describe('toSnakeCase', (): void => {
  it.each([
    ['fullName', 'full_name'],
    ['perPage', 'per_page'],
    ['hireDate', 'hire_date'],
    ['id', 'id'],
  ])('converts %s to %s', (input: string, expected: string): void => {
    expect(toSnakeCase(input)).toBe(expected)
  })
})

describe('keysToCamelCase', (): void => {
  it('converts keys of nested objects and arrays', (): void => {
    const input: unknown = {
      data: [{ full_name: 'Asha Rao', job_title: 'Accountant' }],
      meta: { total_count: 1, current_page: 1 },
    }

    expect(keysToCamelCase(input)).toEqual({
      data: [{ fullName: 'Asha Rao', jobTitle: 'Accountant' }],
      meta: { totalCount: 1, currentPage: 1 },
    })
  })

  it('never changes values, even snake_case strings', (): void => {
    expect(keysToCamelCase({ sort_field: 'hire_date', salary: '85000.00' })).toEqual({
      sortField: 'hire_date',
      salary:    '85000.00',
    })
  })

  it('returns primitives and null unchanged', (): void => {
    expect(keysToCamelCase('hire_date')).toBe('hire_date')
    expect(keysToCamelCase(42)).toBe(42)
    expect(keysToCamelCase(null)).toBeNull()
  })
})

describe('keysToSnakeCase', (): void => {
  it('converts keys of nested objects and arrays', (): void => {
    const input: unknown = { fullName: 'Asha Rao', contacts: [{ emailAddress: 'a@acme.com' }] }

    expect(keysToSnakeCase(input)).toEqual({
      full_name: 'Asha Rao',
      contacts:  [{ email_address: 'a@acme.com' }],
    })
  })

  it('never changes values', (): void => {
    expect(keysToSnakeCase({ sortField: 'hireDate' })).toEqual({ sort_field: 'hireDate' })
  })
})

describe('skipped values', (): void => {
  it.each([
    ['FormData', new FormData()],
    ['Blob', new Blob(['x'])],
    ['Date', new Date('2026-10-31T00:00:00+05:30')],
  ])('leaves a %s untouched in both directions', (_name: string, value: unknown): void => {
    expect(keysToCamelCase(value)).toBe(value)
    expect(keysToSnakeCase(value)).toBe(value)
  })

  it('leaves a nested Date untouched', (): void => {
    const hireDate: Date = new Date('2026-10-31T00:00:00+05:30')

    const converted: unknown = keysToSnakeCase({ hireDate })

    expect(converted).toEqual({ hire_date: hireDate })
    expect((converted as { hire_date: Date }).hire_date).toBe(hireDate)
  })
})
