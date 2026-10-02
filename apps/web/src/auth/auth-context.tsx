import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchCurrentUser, setUserRoles } from '@/api/users'
import { isAuth0WebMode } from '@/auth/auth-mode'
import type { AppRole, AuthSession } from '@/auth/session'
import { clearSession, loadSession, saveSession } from '@/auth/session'
import {
  createStubRegistration,
  createStubSession,
} from '@/auth/stub-jwt'
import { setAccessTokenGetter } from '@/auth/token-bridge'

type RegisterInput = {
  email: string
  displayName: string
  persona: 'mentor' | 'apprentice' | 'dual'
}

type AuthContextValue = {
  session: AuthSession | null
  authMode: 'stub' | 'auth0'
  isLoading: boolean
  login: (input: {
    persona: 'mentor' | 'apprentice' | 'dual' | 'admin'
    displayName: string
  }) => Promise<void>
  register: (input: RegisterInput) => Promise<AuthSession>
  loginWithAuth0: () => Promise<void>
  signupWithAuth0: () => Promise<void>
  logout: () => void
  setActiveRole: (role: AppRole) => void
  completeRoleSelection: (roles: AppRole[]) => Promise<AuthSession>
  refreshSessionFromApi: () => Promise<AuthSession | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAppRoles(roles: string[]): AppRole[] {
  return roles.filter(
    (role): role is AppRole =>
      role === 'MENTOR' || role === 'APPRENTICE' || role === 'ADMIN',
  )
}

function pickActiveRole(
  roles: AppRole[],
  preferred?: AppRole,
): AppRole {
  if (preferred && roles.includes(preferred)) return preferred
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('MENTOR')) return 'MENTOR'
  if (roles.includes('APPRENTICE')) return 'APPRENTICE'
  return 'APPRENTICE'
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const auth0 = useAuth0()
  const authMode: 'stub' | 'auth0' = isAuth0WebMode() ? 'auth0' : 'stub'
  const [session, setSession] = useState<AuthSession | null>(() =>
    authMode === 'stub' ? loadSession() : null,
  )
  const [bootstrapping, setBootstrapping] = useState(authMode === 'auth0')

  const refreshSessionFromApi = useCallback(async () => {
    if (authMode !== 'auth0') {
      return loadSession()
    }
    if (!auth0.isAuthenticated) {
      clearSession()
      setSession(null)
      return null
    }

    const token = await auth0.getAccessTokenSilently()
    const me = await fetchCurrentUser()
    const roles = toAppRoles(me.roles)
    const next: AuthSession = {
      token,
      sub: auth0.user?.sub ?? me.id,
      email: me.email,
      displayName: me.displayName?.trim() || auth0.user?.name || me.email,
      roles,
      activeRole: pickActiveRole(roles),
      emailVerified: me.emailVerified,
      needsRoleSelection: me.needsRoleSelection || roles.length === 0,
    }
    // Preserve activeRole if still valid
    const current = loadSession()
    if (current?.activeRole && roles.includes(current.activeRole)) {
      next.activeRole = current.activeRole
    }
    saveSession(next)
    setSession(next)
    return next
  }, [auth0, authMode])

  useEffect(() => {
    if (authMode !== 'auth0') {
      setAccessTokenGetter(null)
      return
    }

    setAccessTokenGetter(async () => {
      if (!auth0.isAuthenticated) return null
      try {
        return await auth0.getAccessTokenSilently()
      } catch {
        return null
      }
    })

    return () => setAccessTokenGetter(null)
  }, [auth0, authMode])

  useEffect(() => {
    if (authMode !== 'auth0') {
      setBootstrapping(false)
      return
    }
    if (auth0.isLoading) return

    void (async () => {
      try {
        if (auth0.isAuthenticated) {
          await refreshSessionFromApi()
        } else {
          clearSession()
          setSession(null)
        }
      } finally {
        setBootstrapping(false)
      }
    })()
  }, [
    auth0.isAuthenticated,
    auth0.isLoading,
    authMode,
    refreshSessionFromApi,
  ])

  const login = useCallback(
    async (input: {
      persona: 'mentor' | 'apprentice' | 'dual' | 'admin'
      displayName: string
    }) => {
      if (authMode !== 'stub') {
        throw new Error('Stub login is disabled when VITE_AUTH_MODE=auth0')
      }
      const next = await createStubSession(input)
      saveSession(next)
      setSession(next)
    },
    [authMode],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      if (authMode !== 'stub') {
        throw new Error('Stub register is disabled when VITE_AUTH_MODE=auth0')
      }
      const next = await createStubRegistration(input)
      saveSession({
        ...next,
        emailVerified: true,
        needsRoleSelection: false,
      })
      setSession({
        ...next,
        emailVerified: true,
        needsRoleSelection: false,
      })
      // Persist user row via JWT ensure-on-request
      await fetchCurrentUser()
      return {
        ...next,
        emailVerified: true,
        needsRoleSelection: false,
      }
    },
    [authMode],
  )

  const loginWithAuth0 = useCallback(async () => {
    if (authMode !== 'auth0') {
      throw new Error('Auth0 login is disabled when VITE_AUTH_MODE=stub')
    }
    await auth0.loginWithRedirect({
      appState: { returnTo: window.location.pathname },
    })
  }, [auth0, authMode])

  const signupWithAuth0 = useCallback(async () => {
    if (authMode !== 'auth0') {
      throw new Error('Auth0 signup is disabled when VITE_AUTH_MODE=stub')
    }
    await auth0.loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
      appState: { returnTo: '/onboarding/role' },
    })
  }, [auth0, authMode])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    if (authMode === 'auth0') {
      void auth0.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      })
      return
    }
  }, [auth0, authMode])

  const setActiveRole = useCallback((role: AppRole) => {
    setSession((current) => {
      if (!current || !current.roles.includes(role)) return current
      const next = { ...current, activeRole: role }
      saveSession(next)
      return next
    })
  }, [])

  const completeRoleSelection = useCallback(
    async (roles: AppRole[]) => {
      const updated = await setUserRoles(roles)
      const token =
        authMode === 'auth0'
          ? await auth0.getAccessTokenSilently()
          : (loadSession()?.token ?? '')
      const appRoles = toAppRoles(updated.roles)
      const next: AuthSession = {
        token,
        sub: loadSession()?.sub ?? updated.id,
        email: updated.email,
        displayName: updated.displayName?.trim() || updated.email,
        roles: appRoles,
        activeRole: pickActiveRole(appRoles, loadSession()?.activeRole),
        emailVerified: updated.emailVerified,
        needsRoleSelection: false,
      }
      saveSession(next)
      setSession(next)
      return next
    },
    [auth0, authMode],
  )

  const value = useMemo(
    () => ({
      session,
      authMode,
      isLoading: bootstrapping || (authMode === 'auth0' && auth0.isLoading),
      login,
      register,
      loginWithAuth0,
      signupWithAuth0,
      logout,
      setActiveRole,
      completeRoleSelection,
      refreshSessionFromApi,
    }),
    [
      session,
      authMode,
      bootstrapping,
      auth0.isLoading,
      login,
      register,
      loginWithAuth0,
      signupWithAuth0,
      logout,
      setActiveRole,
      completeRoleSelection,
      refreshSessionFromApi,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function StubAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(
    async (input: {
      persona: 'mentor' | 'apprentice' | 'dual' | 'admin'
      displayName: string
    }) => {
      const next = await createStubSession(input)
      saveSession({
        ...next,
        emailVerified: true,
        needsRoleSelection: false,
      })
      setSession({
        ...next,
        emailVerified: true,
        needsRoleSelection: false,
      })
    },
    [],
  )

  const register = useCallback(async (input: RegisterInput) => {
    const next = await createStubRegistration(input)
    const session: AuthSession = {
      ...next,
      emailVerified: true,
      needsRoleSelection: false,
    }
    saveSession(session)
    setSession(session)
    await fetchCurrentUser()
    return session
  }, [])

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

  const completeRoleSelection = useCallback(async (roles: AppRole[]) => {
    const updated = await setUserRoles(roles)
    const current = loadSession()
    if (!current) {
      throw new Error('Not signed in')
    }
    const appRoles = toAppRoles(updated.roles)
    const next: AuthSession = {
      ...current,
      roles: appRoles,
      activeRole: pickActiveRole(appRoles, current.activeRole),
      emailVerified: updated.emailVerified,
      needsRoleSelection: false,
    }
    saveSession(next)
    setSession(next)
    return next
  }, [])

  const value = useMemo(
    () => ({
      session,
      authMode: 'stub' as const,
      isLoading: false,
      login,
      register,
      loginWithAuth0: async () => {
        throw new Error('Auth0 login is disabled when VITE_AUTH_MODE=stub')
      },
      signupWithAuth0: async () => {
        throw new Error('Auth0 signup is disabled when VITE_AUTH_MODE=stub')
      },
      logout,
      setActiveRole,
      completeRoleSelection,
      refreshSessionFromApi: async () => loadSession(),
    }),
    [session, login, register, logout, setActiveRole, completeRoleSelection],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isAuth0WebMode()) {
    return <AuthProviderInner>{children}</AuthProviderInner>
  }
  return <StubAuthProvider>{children}</StubAuthProvider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
