type TKeyConverter = (key: string) => string

const SNAKE_SEGMENT_PATTERN: RegExp = /_([a-z0-9])/g
const UPPERCASE_LETTER_PATTERN: RegExp = /[A-Z]/g

export function toCamelCase(key: string): string {
  return key.replace(SNAKE_SEGMENT_PATTERN, (_match: string, letter: string): string => letter.toUpperCase())
}

export function toSnakeCase(key: string): string {
  return key.replace(UPPERCASE_LETTER_PATTERN, (letter: string): string => `_${letter.toLowerCase()}`)
}

// Only plain objects are converted; FormData, Blob, Date and other class instances pass through.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const prototype: object | null = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function convertKeys(value: unknown, convertKey: TKeyConverter): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown): unknown => convertKeys(item, convertKey))
  }
  if (!isPlainObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]: [string, unknown]): [string, unknown] => [
      convertKey(key),
      convertKeys(item, convertKey),
    ]),
  )
}

export function keysToCamelCase(value: unknown): unknown {
  return convertKeys(value, toCamelCase)
}

export function keysToSnakeCase(value: unknown): unknown {
  return convertKeys(value, toSnakeCase)
}
