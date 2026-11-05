import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

interface IInsightCountry {
  // null until the country list has loaded.
  country:    string | null
  setCountry: (country: string | null) => void
}

const COUNTRY_PARAM: string = 'country'

// The country the job-title insight is shown for, kept in the URL so refreshing or sharing keeps it.
// A country the API doesn't list falls back to the first one.
export function useInsightCountry(countryCodes: readonly string[] | undefined): IInsightCountry {
  const [searchParams, setSearchParams] = useSearchParams()
  const fromUrl: string | null = searchParams.get(COUNTRY_PARAM)
  const country: string | null = fromUrl !== null && countryCodes?.includes(fromUrl) ? fromUrl : countryCodes?.[0] ?? null

  const setCountry: (nextCountry: string | null) => void = useCallback((nextCountry: string | null): void => {
    if (!nextCountry) return
    setSearchParams((current: URLSearchParams): URLSearchParams => {
      const next: URLSearchParams = new URLSearchParams(current)
      next.set(COUNTRY_PARAM, nextCountry)
      return next
    })
  }, [setSearchParams])

  return { country, setCountry }
}
