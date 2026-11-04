// The ONLY file that reads import.meta.env.
export const API_URL: string = import.meta.env.VITE_API_URL || '/'
