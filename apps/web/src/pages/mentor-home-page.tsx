import { Link } from '@tanstack/react-router'
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Circle,
  Inbox,
  Trophy,
  Users,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import {
  BookingRow,
  DashboardHeader,
  DashboardSection,
  EmptyState,
  NotificationList,
  SectionSkeleton,
  StatCard,
  StatGrid,
} from '@/components/dashboard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMyBookings } from '@/api/bookings'
import { useMentorProfile } from '@/api/mentors'
import { useMyMentorships } from '@/api/mentorships'
import { useNotifications } from '@/api/notifications'
import { useMySessions } from '@/api/sessions'
import type { MentorProfile } from '@/api/types'
import { useAuth } from '@/auth/auth-context'
import { bookingsWithStatus, upcomingBookings } from '@/lib/bookings'
import { errorMessage } from '@/lib/errors'

const steps = [
  {
    to: '/mentor/profile',
    label: 'Profile',
    codes: ['PROFILE_NAME', 'BIOGRAPHY'] as const,
  },
  {
    to: '/mentor/languages',
    label: 'Languages',
    codes: ['LANGUAGE'] as const,
  },
  {
    to: '/mentor/expertise',
    label: 'Expertise',
    codes: ['EXPERTISE'] as const,
  },
  {
    to: '/mentor/verification',
    label: 'Verification',
    codes: ['IDENTITY_VERIFIED'] as const,
  },
  {
    to: '/mentor/availability',
    label: 'Availability',
    codes: ['AVAILABILITY'] as const,
  },
  {
    to: '/mentor/publish',
    label: 'Publish',
    codes: [] as const,
  },
] as const

function readiness(profile: MentorProfile | null | undefined) {
  const reqs = profile?.publicationEligibility.requirements ?? []
  return steps.map((step) => {
    const codesSatisfied =
      step.codes.length > 0 &&
      step.codes.every(
        (code) => reqs.find((item) => item.code === code)?.satisfied === true,
      )
    const publishDone =
      step.label === 'Publish' && profile?.publicationStatus === 'PUBLISHED'
    return { ...step, done: publishDone || codesSatisfied }
  })
}

export function MentorHomePage() {
  const { session } = useAuth()
  const profileQuery = useMentorProfile()
  const bookingsQuery = useMyBookings()
  const sessionsQuery = useMySessions(true)
  const mentorshipsQuery = useMyMentorships('ACTIVE')
  const notificationsQuery = useNotifications()

  const profile = profileQuery.data
  const isLive = profile?.publicationStatus === 'PUBLISHED' && profile.isBookable
  const readinessSteps = readiness(profile)
  const doneCount = readinessSteps.filter((step) => step.done).length

  const requests = bookingsWithStatus(bookingsQuery.data, 'REQUESTED')
  const upcoming = upcomingBookings(bookingsQuery.data)
  const completedCount = bookingsWithStatus(
    bookingsQuery.data,
    'COMPLETED',
  ).length
  const mentorships = mentorshipsQuery.data ?? []
  const sessionIdByBooking = new Map(
    (sessionsQuery.data ?? []).map((item) => [item.bookingId, item.id]),
  )

  return (
    <AppShell title="Mentor" fullWidth>
      <div className="space-y-6">
        <DashboardHeader
          title={`Welcome back, ${session?.displayName ?? 'there'}`}
          description={
            isLive
              ? 'Your requests, sessions and mentorships at a glance.'
              : 'Finish the readiness steps to become bookable.'
          }
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to="/mentor/availability">
                  <CalendarRange className="h-4 w-4" />
                  Availability
                </Link>
              </Button>
              <Button asChild>
                <Link to="/mentor/bookings">
                  <Inbox className="h-4 w-4" />
                  Booking inbox
                </Link>
              </Button>
            </>
          }
        />

        {profileQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentor profile</AlertTitle>
            <AlertDescription>{errorMessage(profileQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <StatGrid>
          <StatCard
            label="Requests to review"
            value={requests.length}
            hint={requests.length > 0 ? 'Apprentices are waiting' : 'Inbox clear'}
            icon={Inbox}
            to="/mentor/bookings"
            highlight={requests.length > 0}
          />
          <StatCard
            label="Upcoming sessions"
            value={upcoming.length}
            hint={
              upcoming[0]
                ? `Next with ${upcoming[0].apprenticeDisplayName ?? 'apprentice'}`
                : 'Nothing scheduled'
            }
            icon={CalendarClock}
            to="/mentor/sessions"
          />
          <StatCard
            label="Active mentorships"
            value={mentorships.length}
            hint="Apprentices you guide"
            icon={Users}
            to="/mentor/mentorships"
          />
          <StatCard
            label="Completed sessions"
            value={completedCount}
            hint="All time"
            icon={Trophy}
            to="/mentor/sessions"
          />
        </StatGrid>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardSection
              title="Booking requests"
              description="Accept or decline from the inbox."
              viewAll={{ to: '/mentor/bookings', label: 'Open inbox' }}
            >
              {bookingsQuery.isPending ? (
                <SectionSkeleton rows={2} />
              ) : requests.length === 0 ? (
                <EmptyState>No requests waiting for you.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {requests.slice(0, 5).map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      counterpartName={booking.apprenticeDisplayName}
                      to="/mentor/bookings"
                      actionLabel="Review"
                    />
                  ))}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection
              title="Upcoming sessions"
              description="Accepted bookings, soonest first."
              viewAll={{ to: '/mentor/sessions' }}
            >
              {bookingsQuery.isPending ? (
                <SectionSkeleton />
              ) : upcoming.length === 0 ? (
                <EmptyState>No upcoming sessions.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {upcoming.slice(0, 5).map((booking) => {
                    const sessionId = sessionIdByBooking.get(booking.id)
                    return (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        counterpartName={booking.apprenticeDisplayName}
                        to={
                          sessionId
                            ? `/mentor/sessions/${sessionId}`
                            : '/mentor/bookings'
                        }
                        actionLabel={sessionId ? 'Open' : 'View'}
                      />
                    )
                  })}
                </ul>
              )}
            </DashboardSection>
          </div>

          <div className="space-y-6">
            <DashboardSection
              title="Profile status"
              description={
                isLive
                  ? 'Apprentices can find and book you.'
                  : `${doneCount} of ${steps.length} readiness steps done`
              }
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isLive ? 'default' : 'outline'}>
                    {isLive ? 'Bookable' : 'Not bookable'}
                  </Badge>
                  {profile ? (
                    <Badge variant="secondary">{profile.publicationStatus}</Badge>
                  ) : null}
                </div>
                {!isLive ? (
                  <>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={steps.length}
                      aria-valuenow={doneCount}
                      aria-label="Readiness"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(doneCount / steps.length) * 100}%` }}
                      />
                    </div>
                    <ul className="space-y-1">
                      {readinessSteps.map((step) => (
                        <li key={step.to}>
                          <Link
                            to={step.to}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
                          >
                            {step.done ? (
                              <CheckCircle2 className="h-4 w-4 text-foreground" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={
                                step.done ? 'text-muted-foreground' : 'font-medium'
                              }
                            >
                              {step.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </DashboardSection>

            <DashboardSection
              title="Mentorships"
              viewAll={{ to: '/mentor/mentorships' }}
            >
              {mentorshipsQuery.isPending ? (
                <SectionSkeleton rows={2} />
              ) : mentorships.length === 0 ? (
                <EmptyState>No active mentorships yet.</EmptyState>
              ) : (
                <ul className="space-y-1">
                  {mentorships.slice(0, 4).map((mentorship) => {
                    const goal = mentorship.goals.find(
                      (item) => item.status === 'ACTIVE',
                    )
                    return (
                      <li key={mentorship.id}>
                        <Link
                          to="/mentor/mentorships/$mentorshipId"
                          params={{ mentorshipId: mentorship.id }}
                          className="block rounded-md px-2 py-2 transition-colors hover:bg-accent"
                        >
                          <span className="block truncate text-sm font-medium">
                            {mentorship.apprenticeDisplayName ?? 'Apprentice'} ·{' '}
                            {mentorship.primarySkillName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {goal ? `Goal: ${goal.title}` : 'No active goal'}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection
              title="Recent notifications"
              viewAll={{ to: '/notifications' }}
            >
              {notificationsQuery.isPending ? (
                <SectionSkeleton rows={3} />
              ) : (notificationsQuery.data ?? []).length === 0 ? (
                <EmptyState>You're all caught up.</EmptyState>
              ) : (
                <NotificationList
                  notifications={(notificationsQuery.data ?? []).slice(0, 5)}
                />
              )}
            </DashboardSection>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
