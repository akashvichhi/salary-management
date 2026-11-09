import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import { SEARCH_DEBOUNCE_MS } from '@src/constants/employee_constants'
import { useSearchInput } from '@src/pages/employee_list/hooks/use_search_input'
import type { ISearchInput } from '@src/pages/employee_list/hooks/use_search_input'

interface IHookProps {
  urlSearch: string
}

function type(result: { current: ISearchInput }, text: string): void {
  act((): void => {
    result.current.onChange({ currentTarget: { value: text } } as React.ChangeEvent<HTMLInputElement>)
  })
}

beforeEach((): void => {
  vi.useFakeTimers()
})

afterEach((): void => {
  vi.useRealTimers()
})

describe('useSearchInput', (): void => {
  it('sends the trimmed text once the user stops typing', (): void => {
    const onSearch: Mock<(search: string) => void> = vi.fn<(search: string) => void>()
    const { result } = renderHook((): ISearchInput => useSearchInput('', onSearch))

    type(result, ' asha ')
    act((): void => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('asha')
  })

  it('lets a URL change made while typing (the back button) win over the typed text', (): void => {
    const onSearch: Mock<(search: string) => void> = vi.fn<(search: string) => void>()
    const { result, rerender } = renderHook(
      ({ urlSearch }: IHookProps): ISearchInput => useSearchInput(urlSearch, onSearch),
      { initialProps: { urlSearch: '' } },
    )

    type(result, 'ab')
    rerender({ urlSearch: 'rao' })
    act((): void => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(onSearch).not.toHaveBeenCalled()
    expect(result.current.value).toBe('rao')
  })
})
