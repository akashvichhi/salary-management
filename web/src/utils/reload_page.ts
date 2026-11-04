// The one wrapper around window.location.reload, so tests can replace it.
export function reloadPage(): void {
  window.location.reload()
}
