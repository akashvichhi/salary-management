import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { DEFAULT_PAGE, DESCENDING_PREFIX } from '@src/constants/list_constants'
import { toSnakeCase } from '@src/utils/case_converter'

export interface IListUrlConfig<TFilterKey extends string> {
  // Each filter's allowed values; anything else in the URL is ignored.
  filters:        Readonly<Record<TFilterKey, readonly string[]>>
  sortFields:     readonly string[]
  defaultSort:    string
  perPageOptions: readonly number[]
  defaultPerPage: number
}

interface INavigationOptions {
  replace?: boolean
}

export interface IListUrlState<TFilterKey extends string> {
  page:             number
  perPage:          number
  search:           string
  sort:             string
  filters:          Readonly<Record<TFilterKey, string | null>>
  hasActiveFilters: boolean
  // True while the list is sorted by anything other than its default.
  isSorted:         boolean
  setPage:          (page: number, options?: INavigationOptions) => void
  setPerPage:       (perPage: number) => void
  setSearch:        (search: string) => void
  setSort:          (sort: string) => void
  clearSort:        () => void
  setFilter:        (key: TFilterKey, value: string | null) => void
  clearFilters:     () => void
}

type TParamChanges = Record<string, string | null>

const PAGE_PARAM: string = 'page'
const PER_PAGE_PARAM: string = 'per_page'
const SEARCH_PARAM: string = 'search'
const SORT_PARAM: string = 'sort'
const POSITIVE_INTEGER_PATTERN: RegExp = /^[1-9]\d*$/

function parsePage(value: string | null): number {
  return value !== null && POSITIVE_INTEGER_PATTERN.test(value) ? Number(value) : DEFAULT_PAGE
}

function parsePerPage(value: string | null, options: readonly number[], fallback: number): number {
  const perPage: number = Number(value)
  return options.includes(perPage) ? perPage : fallback
}

function parseSort(value: string | null, fields: readonly string[], fallback: string): string {
  if (value === null) return fallback
  return fields.includes(value.replace(DESCENDING_PREFIX, '')) ? value : fallback
}

function parseFilters<TFilterKey extends string>(
  params: URLSearchParams,
  allowed: Readonly<Record<TFilterKey, readonly string[]>>,
): Record<TFilterKey, string | null> {
  const keys: TFilterKey[] = Object.keys(allowed) as TFilterKey[]
  return Object.fromEntries(keys.map((key: TFilterKey): [TFilterKey, string | null] => {
    const value: string | null = params.get(toSnakeCase(key))
    return [key, value !== null && allowed[key].includes(value) ? value : null]
  })) as Record<TFilterKey, string | null>
}

// Empty and default values are removed, so the URL only shows what differs from the default view.
function applyChanges(current: URLSearchParams, changes: TParamChanges, resetPage: boolean): URLSearchParams {
  const next: URLSearchParams = new URLSearchParams(current)
  Object.entries(changes).forEach(([key, value]: [string, string | null]): void => {
    if (value) next.set(key, value)
    else next.delete(key)
  })
  if (resetPage) next.delete(PAGE_PARAM)
  return next
}

/**
 * The one place a list's page, page size, search, filters and sort are read from and written to
 * the URL, so refresh, the back button and shared links keep the view. Any change other than the
 * page itself goes back to page 1.
 */
export function useListUrlState<TFilterKey extends string>(
  config: IListUrlConfig<TFilterKey>,
): IListUrlState<TFilterKey> {
  const [searchParams, setSearchParams] = useSearchParams()

  const update: (changes: TParamChanges, resetPage: boolean, options?: INavigationOptions) => void = useCallback(
    (changes: TParamChanges, resetPage: boolean, options?: INavigationOptions): void => {
      setSearchParams((current: URLSearchParams): URLSearchParams => applyChanges(current, changes, resetPage), options)
    },
    [setSearchParams],
  )

  const setPage: (page: number, options?: INavigationOptions) => void = useCallback(
    (page: number, options?: INavigationOptions): void => {
      update({ [PAGE_PARAM]: page === DEFAULT_PAGE ? null : String(page) }, false, options)
    },
    [update],
  )

  const setPerPage: (perPage: number) => void = useCallback((perPage: number): void => {
    update({ [PER_PAGE_PARAM]: perPage === config.defaultPerPage ? null : String(perPage) }, true)
  }, [update, config.defaultPerPage])

  // Replaces the history entry, so each debounced keystroke doesn't add a "back" step.
  const setSearch: (search: string) => void = useCallback((search: string): void => {
    update({ [SEARCH_PARAM]: search }, true, { replace: true })
  }, [update])

  const setSort: (sort: string) => void = useCallback((sort: string): void => {
    update({ [SORT_PARAM]: sort === config.defaultSort ? null : sort }, true)
  }, [update, config.defaultSort])

  const clearSort: () => void = useCallback((): void => {
    setSort(config.defaultSort)
  }, [setSort, config.defaultSort])

  const setFilter: (key: TFilterKey, value: string | null) => void = useCallback(
    (key: TFilterKey, value: string | null): void => {
      update({ [toSnakeCase(key)]: value }, true)
    },
    [update],
  )

  const clearFilters: () => void = useCallback((): void => {
    const filterParams: string[] = Object.keys(config.filters).map(toSnakeCase)
    const changes: TParamChanges = Object.fromEntries(
      [SEARCH_PARAM, ...filterParams].map((key: string): [string, null] => [key, null]),
    )
    update(changes, true)
  }, [update, config.filters])

  return useMemo<IListUrlState<TFilterKey>>((): IListUrlState<TFilterKey> => {
    const search: string = searchParams.get(SEARCH_PARAM) ?? ''
    const filters: Record<TFilterKey, string | null> = parseFilters(searchParams, config.filters)
    const sort: string = parseSort(searchParams.get(SORT_PARAM), config.sortFields, config.defaultSort)

    return {
      page:             parsePage(searchParams.get(PAGE_PARAM)),
      perPage:          parsePerPage(searchParams.get(PER_PAGE_PARAM), config.perPageOptions, config.defaultPerPage),
      search,
      sort,
      filters,
      hasActiveFilters: search !== '' || Object.values<string | null>(filters).some(Boolean),
      isSorted:         sort !== config.defaultSort,
      setPage,
      setPerPage,
      setSearch,
      setSort,
      clearSort,
      setFilter,
      clearFilters,
    }
  }, [searchParams, config, setPage, setPerPage, setSearch, setSort, clearSort, setFilter, clearFilters])
}
