export type WebAuthMode = 'stub' | 'auth0'

export function getWebAuthMode(): WebAuthMode {
  const mode = (import.meta.env.VITE_AUTH_MODE ?? 'stub').toLowerCase()
  return mode === 'auth0' ? 'auth0' : 'stub'
}

export function isAuth0WebMode(): boolean {
  return getWebAuthMode() === 'auth0'
}
