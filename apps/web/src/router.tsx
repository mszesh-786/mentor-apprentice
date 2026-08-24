import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { AuthProvider } from '@/auth/auth-context'
import { loadSession } from '@/auth/session'
import { LoginPage } from '@/pages/login-page'
import { MentorHomePage } from '@/pages/mentor-home-page'
import { ApprenticeHomePage } from '@/pages/apprentice-home-page'

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const session = loadSession()
    if (!session) throw redirect({ to: '/login' })
    throw redirect({
      to: session.activeRole === 'MENTOR' ? '/mentor' : '/apprentice',
    })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const session = loadSession()
    if (session) {
      throw redirect({
        to: session.activeRole === 'MENTOR' ? '/mentor' : '/apprentice',
      })
    }
  },
  component: LoginPage,
})

function requireAuth(role?: 'MENTOR' | 'APPRENTICE') {
  const session = loadSession()
  if (!session) throw redirect({ to: '/login' })
  if (role && !session.roles.includes(role)) {
    throw redirect({
      to: session.activeRole === 'MENTOR' ? '/mentor' : '/apprentice',
    })
  }
  return session
}

const mentorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorHomePage,
})

const apprenticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeHomePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  mentorRoute,
  apprenticeRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
