// The ONLY file that reads import.meta.env.
export const API_URL: string = import.meta.env.VITE_API_URL || '/'

// Fills in the login form for a demo. Whatever is set here is readable by anyone who opens the app,
// so it is only ever the demo account's login, never a real one.
export const DEMO_LOGIN_EMAIL: string = import.meta.env.VITE_DEMO_LOGIN_EMAIL ?? ''
export const DEMO_LOGIN_PASSWORD: string = import.meta.env.VITE_DEMO_LOGIN_PASSWORD ?? ''
