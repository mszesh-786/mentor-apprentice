import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppRole, AuthSession } from '@/auth/session'
import { clearSession, loadSession, saveSession } from '@/auth/session'
import { createStubSession } from '@/auth/stub-jwt'

type AuthContextValue = {
  session: AuthSession | null
  login: (input: {
    persona: 'mentor' | 'apprentice' | 'dual'
    displayName: string
  }) => Promise<void>
  logout: () => void
  setActiveRole: (role: AppRole) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(
    async (input: {
      persona: 'mentor' | 'apprentice' | 'dual'
      displayName: string
    }) => {
      const next = await createStubSession(input)
      saveSession(next)
      setSession(next)
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const setActiveRole = useCallback((role: AppRole) => {
    setSession((current) => {
      if (!current || !current.roles.includes(role)) return current
      const next = { ...current, activeRole: role }
      saveSession(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ session, login, logout, setActiveRole }),
    [session, login, logout, setActiveRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
