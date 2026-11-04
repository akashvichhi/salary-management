import { describe, expect, it } from 'vitest'

import { isChunkLoadError } from '@src/utils/is_chunk_load_error'

describe('isChunkLoadError', (): void => {
  it.each([
    'Failed to fetch dynamically imported module: https://app.example/assets/abc123.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: https://app.example/assets/abc123.js',
  ])('recognises "%s"', (message: string): void => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true)
  })

  it('recognises an error named ChunkLoadError', (): void => {
    const error: Error = new Error('Loading chunk 3 failed')
    error.name = 'ChunkLoadError'

    expect(isChunkLoadError(error)).toBe(true)
  })

  it('does not treat other errors as chunk-load errors', (): void => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
  })

  it.each([
    ['a string', 'Failed to fetch dynamically imported module'],
    ['null', null],
    ['an API error', { error: 'Employee not found' }],
  ])('returns false for %s', (_name: string, value: unknown): void => {
    expect(isChunkLoadError(value)).toBe(false)
  })
})
