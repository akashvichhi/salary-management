import { RELOAD_LABEL, ROOT_ERROR_MESSAGE, ROOT_ERROR_TITLE } from '@src/constants/error_messages'
import { ROUTE_PATHS } from '@src/routes/route_paths'

// Plain HTML on purpose: it renders when the providers themselves failed, so it must not depend on them.
export function RootErrorFallback(): React.JSX.Element {
  return (
    <main>
      <h1>{ROOT_ERROR_TITLE}</h1>
      <p>{ROOT_ERROR_MESSAGE}</p>
      <a href={ROUTE_PATHS.home}>{RELOAD_LABEL}</a>
    </main>
  )
}
