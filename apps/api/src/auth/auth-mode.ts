export type AuthMode = 'stub' | 'auth0';

export function getAuthMode(): AuthMode {
  const mode = (process.env.AUTH_MODE ?? 'stub').toLowerCase();
  return mode === 'auth0' ? 'auth0' : 'stub';
}

export function isAuth0Mode(): boolean {
  return getAuthMode() === 'auth0';
}
