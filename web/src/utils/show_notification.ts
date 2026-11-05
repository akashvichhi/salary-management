import { notifications } from '@mantine/notifications'

const SUCCESS_COLOR: string = 'green'
const ERROR_COLOR: string = 'red'

// The one place notifications are shown, so every success and failure looks the same.
export function showSuccessNotification(message: string): void {
  notifications.show({ color: SUCCESS_COLOR, message })
}

export function showErrorNotification(message: string): void {
  notifications.show({ color: ERROR_COLOR, message })
}
