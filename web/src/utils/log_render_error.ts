import type { ErrorInfo } from 'react'

// Render errors come from our own components, so they carry code paths, not personal data.
export function logRenderError(error: unknown, info: ErrorInfo): void {
  console.error(error, info.componentStack)
}
