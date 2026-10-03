export type AuthMode = 'stub' | 'auth0';

export function getAuthMode(): AuthMode {
  const mode = (process.env.AUTH_MODE ?? 'stub').toLowerCase();
  return mode === 'auth0' ? 'auth0' : 'stub';
}

export function isAuth0Mode(): boolean {
  return getAuthMode() === 'auth0';
}

/**
 * Stub mode trusts any HS256 token signed with JWT_SECRET, and the web app ships
 * that secret to the browser — anyone could mint an ADMIN token. Never allow it in production.
 */
export function assertSafeAuthMode(env: NodeJS.ProcessEnv = process.env): void {
  const isProduction = env.NODE_ENV === 'production';
  const isStub = (env.AUTH_MODE ?? 'stub').toLowerCase() !== 'auth0';
  if (isProduction && isStub && env.ALLOW_STUB_AUTH !== 'true') {
    throw new Error(
      'AUTH_MODE=stub is not allowed when NODE_ENV=production. Set AUTH_MODE=auth0 (or ALLOW_STUB_AUTH=true for a private, non-public environment).',
    );
  }
}
