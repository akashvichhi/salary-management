import { useCallback, useState } from 'react'

import { useDebouncedCallback } from '@mantine/hooks'

import { SEARCH_DEBOUNCE_MS } from '@src/constants/employee_constants'

export interface ISearchInput {
  value:    string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  // Drops the text being typed and the search still waiting for the user to stop typing.
  reset:    () => void
}

interface ISearchDraft {
  text:      string
  // The URL's search when this text was typed.
  urlSearch: string
}

type TSendSearch = ReturnType<typeof useDebouncedCallback<(search: string, typedOver: string) => void>>

/**
 * The search box's text, sent to the URL only after the user stops typing.
 * The URL stays the source of truth: typed text is shown only while it still belongs to the URL's
 * search (the one it was typed over, or the one it became), so a change made elsewhere, like the
 * back button, shows the URL's value instead.
 */
export function useSearchInput(urlSearch: string, onSearch: (search: string) => void): ISearchInput {
  const [draft, setDraft] = useState<ISearchDraft | null>(null)

  // Mantine calls the latest version of this callback, so `urlSearch` here is the URL's current
  // search. If it moved since the typing (the back button), the URL wins and the text is dropped.
  const sendSearch: TSendSearch = useDebouncedCallback((search: string, typedOver: string): void => {
    if (urlSearch === typedOver && search !== typedOver) onSearch(search)
  }, SEARCH_DEBOUNCE_MS)

  const onChange: (event: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const text: string = event.currentTarget.value
      setDraft({ text, urlSearch })
      sendSearch(text.trim(), urlSearch)
    },
    [urlSearch, sendSearch],
  )

  const reset: () => void = useCallback((): void => {
    sendSearch.cancel()
    setDraft(null)
  }, [sendSearch])

  const showsDraft: boolean = draft !== null && (draft.urlSearch === urlSearch || draft.text.trim() === urlSearch)

  return { value: showsDraft && draft ? draft.text : urlSearch, onChange, reset }
}
