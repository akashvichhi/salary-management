import type { MantineColorScheme } from '@mantine/core'

export const APP_NAME: string = 'Salary Management'
// Light or dark follows the operating system's setting. index.html applies the same rule
// before React loads, so a dark system never sees a white flash.
export const DEFAULT_COLOR_SCHEME: MantineColorScheme = 'auto'
export const PAGE_LOADING_LABEL: string = 'Loading page'
// Icons shown beside button and input text.
export const ICON_SIZE: number = 16
