import { MemoryRouter, useLocation } from 'react-router'

import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useListUrlState } from '@src/hooks/use_list_url_state'
import type { IListUrlConfig, IListUrlState } from '@src/hooks/use_list_url_state'

type TFilterKey = 'country' | 'jobTitle'

interface IHookResult {
  state:  IListUrlState<TFilterKey>
  search: string
}

const CONFIG: IListUrlConfig<TFilterKey> = {
  filters:        { country: ['IN', 'US'], jobTitle: ['Accountant', 'Recruiter'] },
  sortFields:     ['full_name', 'salary'],
  defaultSort:    'full_name',
  perPageOptions: [20, 50],
  defaultPerPage: 20,
}

function renderListUrlState(url: string = '/employees'): RenderHookResult<IHookResult, unknown> {
  return renderHook(
    (): IHookResult => ({ state: useListUrlState(CONFIG), search: useLocation().search }),
    {
      wrapper: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      ),
    },
  )
}

describe('useListUrlState', (): void => {
  it('uses the defaults when the URL has no list state', (): void => {
    const { result } = renderListUrlState()

    expect(result.current.state).toMatchObject({
      page:    1,
      perPage: 20,
      search:  '',
      sort:    'full_name',
      filters: { country: null, jobTitle: null },
    })
  })

  it('reads the list state from the URL, with snake_case keys', (): void => {
    const { result } = renderListUrlState('/employees?page=3&per_page=50&search=asha&sort=-salary&country=IN&job_title=Accountant')

    expect(result.current.state).toMatchObject({
      page:    3,
      perPage: 50,
      search:  'asha',
      sort:    '-salary',
      filters: { country: 'IN', jobTitle: 'Accountant' },
    })
  })

  it.each([
    ['a page that is not a positive whole number', 'page=-2', { page: 1 }],
    ['a page size that is not offered', 'per_page=7', { perPage: 20 }],
    ['an unknown sort field', 'sort=-password', { sort: 'full_name' }],
    ['a sort with a "-" that is not its prefix', 'sort=salary-', { sort: 'full_name' }],
    ['a filter value outside its list', 'country=XX', { filters: { country: null, jobTitle: null } }],
  ])('falls back to the default for %s', (_name: string, query: string, expected: object): void => {
    const { result } = renderListUrlState(`/employees?${query}`)

    expect(result.current.state).toMatchObject(expected)
  })

  it('caps a page beyond the API\'s limit, so the list can step back to its last page', (): void => {
    const { result } = renderListUrlState('/employees?page=99999999')

    expect(result.current.state.page).toBe(1_000_000)
  })

  it('writes the page and keeps the rest of the state', (): void => {
    const { result } = renderListUrlState('/employees?country=IN')

    act((): void => {
      result.current.state.setPage(4)
    })

    expect(result.current.search).toBe('?country=IN&page=4')
  })

  it.each([
    ['a filter', (state: IListUrlState<TFilterKey>): void => state.setFilter('country', 'US'), '?country=US'],
    ['the search', (state: IListUrlState<TFilterKey>): void => state.setSearch('rao'), '?search=rao'],
    ['the sort', (state: IListUrlState<TFilterKey>): void => state.setSort('-salary'), '?sort=-salary'],
    ['the page size', (state: IListUrlState<TFilterKey>): void => state.setPerPage(50), '?per_page=50'],
  ])('resets to page 1 when %s changes', (
    _name: string,
    change: (state: IListUrlState<TFilterKey>) => void,
    expectedSearch: string,
  ): void => {
    const { result } = renderListUrlState('/employees?page=5')

    act((): void => {
      change(result.current.state)
    })

    expect(result.current.search).toBe(expectedSearch)
    expect(result.current.state.page).toBe(1)
  })

  it('leaves default and empty values out of the URL', (): void => {
    const { result } = renderListUrlState('/employees?country=IN&search=asha&page=2')

    act((): void => {
      result.current.state.setFilter('country', null)
    })
    act((): void => {
      result.current.state.setSearch('')
    })

    expect(result.current.search).toBe('')
  })

  it('clears the search and every filter but keeps the sort', (): void => {
    const { result } = renderListUrlState('/employees?country=IN&job_title=Recruiter&search=asha&sort=-salary&page=3')

    act((): void => {
      result.current.state.clearFilters()
    })

    expect(result.current.search).toBe('?sort=-salary')
    expect(result.current.state.hasActiveFilters).toBe(false)
  })

  it('reports whether a search or filter is active', (): void => {
    expect(renderListUrlState('/employees?sort=-salary&page=2').result.current.state.hasActiveFilters).toBe(false)
    expect(renderListUrlState('/employees?search=asha').result.current.state.hasActiveFilters).toBe(true)
    expect(renderListUrlState('/employees?job_title=Recruiter').result.current.state.hasActiveFilters).toBe(true)
  })
})
