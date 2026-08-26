export type AppRole = 'MENTOR' | 'APPRENTICE'

export type AuthSession = {
  token: string
  sub: string
  email: string
  displayName: string
  roles: AppRole[]
  activeRole: AppRole
  emailVerified?: boolean
  needsRoleSelection?: boolean
}

const STORAGE_KEY = 'ma.auth'

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
