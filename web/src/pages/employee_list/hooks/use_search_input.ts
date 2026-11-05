import { useCallback, useEffect, useRef, useState } from 'react'

import { useDebouncedValue } from '@mantine/hooks'

import { SEARCH_DEBOUNCE_MS } from '@src/constants/employee_constants'

interface ISearchInput {
  value:    string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * The search box's text, sent to the URL only after the user stops typing.
 * The URL stays the source of truth: when it changes elsewhere (clear filters, the back button),
 * the box shows the new value.
 */
export function useSearchInput(urlSearch: string, onSearch: (search: string) => void): ISearchInput {
  const [value, setValue] = useState<string>(urlSearch)
  const [debouncedValue] = useDebouncedValue<string>(value.trim(), SEARCH_DEBOUNCE_MS)

  // Read through a ref, so only a new debounced value sends a search, never a URL change.
  const latest: React.RefObject<{ urlSearch: string, onSearch: (search: string) => void }> = useRef({ urlSearch, onSearch })
  useEffect((): void => {
    latest.current = { urlSearch, onSearch }
  }, [urlSearch, onSearch])

  useEffect((): void => {
    setValue((current: string): string => (current.trim() === urlSearch ? current : urlSearch))
  }, [urlSearch])

  useEffect((): void => {
    if (debouncedValue !== latest.current.urlSearch) latest.current.onSearch(debouncedValue)
  }, [debouncedValue])

  const onChange: (event: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setValue(event.currentTarget.value)
    },
    [],
  )

  return { value, onChange }
}
