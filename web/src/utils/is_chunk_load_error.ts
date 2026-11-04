import { CHUNK_LOAD_ERROR_MESSAGES, CHUNK_LOAD_ERROR_NAME } from '@src/constants/error_handling_constants'

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === CHUNK_LOAD_ERROR_NAME) return true
  return CHUNK_LOAD_ERROR_MESSAGES.some((message: string): boolean => error.message.includes(message))
}
