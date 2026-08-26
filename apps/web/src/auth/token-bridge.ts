let accessTokenGetter: (() => Promise<string | null>) | null = null

export function setAccessTokenGetter(
  getter: (() => Promise<string | null>) | null,
): void {
  accessTokenGetter = getter
}

export async function resolveAccessToken(
  fallback: string | null | undefined,
): Promise<string | null> {
  if (accessTokenGetter) {
    try {
      const token = await accessTokenGetter()
      if (token) return token
    } catch {
      // fall through to stored session token
    }
  }
  return fallback ?? null
}
