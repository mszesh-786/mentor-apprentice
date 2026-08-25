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
import { MentorProfilePage } from '@/pages/mentor/profile-page'
import { MentorLanguagesPage } from '@/pages/mentor/languages-page'
import { MentorExpertisePage } from '@/pages/mentor/expertise-page'
import { MentorVerificationPage } from '@/pages/mentor/verification-page'
import { MentorAvailabilityPage } from '@/pages/mentor/availability-page'
import { MentorPublishPage } from '@/pages/mentor/publish-page'
import { MentorBookingsPage } from '@/pages/mentor/bookings-page'
import { MentorSessionsPage } from '@/pages/mentor/sessions-page'
import { MentorSessionDetailPage } from '@/pages/mentor/session-detail-page'
import { MentorMentorshipsPage } from '@/pages/mentor/mentorships-page'
import { MentorMentorshipDetailPage } from '@/pages/mentor/mentorship-detail-page'
import { ApprenticeProfilePage } from '@/pages/apprentice/profile-page'
import { ApprenticeDiscoverPage } from '@/pages/apprentice/discover-page'
import { ApprenticeMentorDetailPage } from '@/pages/apprentice/mentor-detail-page'
import { ApprenticeBookingsPage } from '@/pages/apprentice/bookings-page'
import { ApprenticeSessionsPage } from '@/pages/apprentice/sessions-page'
import { ApprenticeSessionDetailPage } from '@/pages/apprentice/session-detail-page'
import { ApprenticeMentorshipsPage } from '@/pages/apprentice/mentorships-page'
import { ApprenticeMentorshipDetailPage } from '@/pages/apprentice/mentorship-detail-page'
import { ProductFeedbackPage } from '@/pages/feedback/product-feedback-page'
import { BlocksPage } from '@/pages/blocks/blocks-page'
import { ReportsPage } from '@/pages/reports/reports-page'

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

const mentorProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/profile',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorProfilePage,
})

const mentorLanguagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/languages',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorLanguagesPage,
})

const mentorExpertiseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/expertise',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorExpertisePage,
})

const mentorVerificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/verification',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorVerificationPage,
})

const mentorAvailabilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/availability',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorAvailabilityPage,
})

const mentorPublishRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/publish',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorPublishPage,
})

const mentorBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/bookings',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorBookingsPage,
})

const mentorSessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/sessions',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorSessionsPage,
})

const mentorSessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/sessions/$sessionId',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorSessionDetailPage,
})

const apprenticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeHomePage,
})

const apprenticeProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/profile',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeProfilePage,
})

const apprenticeDiscoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/discover',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeDiscoverPage,
})

const apprenticeMentorDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/discover/$profileId',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeMentorDetailPage,
})

const apprenticeBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/bookings',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeBookingsPage,
})

const apprenticeSessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/sessions',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeSessionsPage,
})

const apprenticeSessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/sessions/$sessionId',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeSessionDetailPage,
})

const mentorMentorshipsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/mentorships',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorMentorshipsPage,
})

const mentorMentorshipDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mentor/mentorships/$mentorshipId',
  beforeLoad: () => {
    requireAuth('MENTOR')
  },
  component: MentorMentorshipDetailPage,
})

const apprenticeMentorshipsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/mentorships',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeMentorshipsPage,
})

const apprenticeMentorshipDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apprentice/mentorships/$mentorshipId',
  beforeLoad: () => {
    requireAuth('APPRENTICE')
  },
  component: ApprenticeMentorshipDetailPage,
})

const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback',
  beforeLoad: () => {
    requireAuth()
  },
  component: ProductFeedbackPage,
})

const blocksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blocks',
  beforeLoad: () => {
    requireAuth()
  },
  component: BlocksPage,
})

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  beforeLoad: () => {
    requireAuth()
  },
  component: ReportsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  feedbackRoute,
  blocksRoute,
  reportsRoute,
  mentorRoute,
  mentorProfileRoute,
  mentorLanguagesRoute,
  mentorExpertiseRoute,
  mentorVerificationRoute,
  mentorAvailabilityRoute,
  mentorPublishRoute,
  mentorBookingsRoute,
  mentorSessionsRoute,
  mentorSessionDetailRoute,
  mentorMentorshipsRoute,
  mentorMentorshipDetailRoute,
  apprenticeRoute,
  apprenticeProfileRoute,
  apprenticeDiscoverRoute,
  apprenticeMentorDetailRoute,
  apprenticeBookingsRoute,
  apprenticeSessionsRoute,
  apprenticeSessionDetailRoute,
  apprenticeMentorshipsRoute,
  apprenticeMentorshipDetailRoute,
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
