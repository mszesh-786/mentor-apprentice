import { Link } from '@tanstack/react-router'
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Hourglass,
  Search,
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
import { Button } from '@/components/ui/button'
import { useApprenticeProfile } from '@/api/apprentices'
import { useMyBookings } from '@/api/bookings'
import { useMyMentorships } from '@/api/mentorships'
import { useNotifications } from '@/api/notifications'
import { useMySessions } from '@/api/sessions'
import { useAuth } from '@/auth/auth-context'
import { bookingsWithStatus, upcomingBookings } from '@/lib/bookings'
import { errorMessage } from '@/lib/errors'

export function ApprenticeHomePage() {
  const { session } = useAuth()
  const profileQuery = useApprenticeProfile()
  const bookingsQuery = useMyBookings()
  const sessionsQuery = useMySessions(true)
  const mentorshipsQuery = useMyMentorships('ACTIVE')
  const notificationsQuery = useNotifications()

  const profile = profileQuery.data
  const upcoming = upcomingBookings(bookingsQuery.data)
  const pending = bookingsWithStatus(bookingsQuery.data, 'REQUESTED')
  const completedCount = bookingsWithStatus(
    bookingsQuery.data,
    'COMPLETED',
  ).length
  const mentorships = mentorshipsQuery.data ?? []
  const sessionIdByBooking = new Map(
    (sessionsQuery.data ?? []).map((item) => [item.bookingId, item.id]),
  )
  const hasAnyBooking = (bookingsQuery.data?.length ?? 0) > 0

  const checklist = [
    { label: 'Create your profile', done: Boolean(profile), to: '/apprentice/profile' },
    { label: 'Find a mentor', done: hasAnyBooking, to: '/apprentice/discover' },
    { label: 'Complete your first session', done: completedCount > 0, to: '/apprentice/sessions' },
  ]
  const checklistDone = checklist.every((item) => item.done)

  return (
    <AppShell title="Apprentice" fullWidth>
      <div className="space-y-6">
        <DashboardHeader
          title={`Welcome back, ${session?.displayName ?? 'there'}`}
          description="Your sessions, requests and mentorships at a glance."
          actions={
            <Button asChild>
              <Link to="/apprentice/discover">
                <Search className="h-4 w-4" />
                Find a mentor
              </Link>
            </Button>
          }
        />

        {profileQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load apprentice profile</AlertTitle>
            <AlertDescription>{errorMessage(profileQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <StatGrid>
          <StatCard
            label="Upcoming sessions"
            value={upcoming.length}
            hint={upcoming[0] ? `Next with ${upcoming[0].mentorDisplayName ?? 'mentor'}` : 'Nothing scheduled'}
            icon={CalendarClock}
            to="/apprentice/sessions"
          />
          <StatCard
            label="Pending requests"
            value={pending.length}
            hint="Waiting for mentor reply"
            icon={Hourglass}
            to="/apprentice/bookings"
          />
          <StatCard
            label="Active mentorships"
            value={mentorships.length}
            hint="Ongoing learning paths"
            icon={Users}
            to="/apprentice/mentorships"
          />
          <StatCard
            label="Completed sessions"
            value={completedCount}
            hint="All time"
            icon={Trophy}
            to="/apprentice/bookings"
          />
        </StatGrid>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardSection
              title="Upcoming sessions"
              description="Accepted bookings, soonest first."
              viewAll={{ to: '/apprentice/sessions' }}
            >
              {bookingsQuery.isPending ? (
                <SectionSkeleton />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  action={
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/apprentice/discover">Browse mentors</Link>
                    </Button>
                  }
                >
                  No upcoming sessions yet.
                </EmptyState>
              ) : (
                <ul className="space-y-2">
                  {upcoming.slice(0, 5).map((booking) => {
                    const sessionId = sessionIdByBooking.get(booking.id)
                    return (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        counterpartName={booking.mentorDisplayName}
                        to={
                          sessionId
                            ? `/apprentice/sessions/${sessionId}`
                            : '/apprentice/bookings'
                        }
                        actionLabel={sessionId ? 'Open' : 'View'}
                      />
                    )
                  })}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection
              title="Pending requests"
              description="Booking requests your mentors have not answered yet."
              viewAll={{ to: '/apprentice/bookings' }}
            >
              {bookingsQuery.isPending ? (
                <SectionSkeleton rows={2} />
              ) : pending.length === 0 ? (
                <EmptyState>No pending requests.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {pending.slice(0, 5).map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      counterpartName={booking.mentorDisplayName}
                      to="/apprentice/bookings"
                      actionLabel="View"
                    />
                  ))}
                </ul>
              )}
            </DashboardSection>
          </div>

          <div className="space-y-6">
            {!checklistDone ? (
              <DashboardSection
                title="Get started"
                description={`${checklist.filter((item) => item.done).length} of ${checklist.length} done`}
              >
                <ul className="space-y-1">
                  {checklist.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-foreground" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={
                            item.done ? 'text-muted-foreground line-through' : ''
                          }
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </DashboardSection>
            ) : null}

            <DashboardSection
              title="Mentorships"
              viewAll={{ to: '/apprentice/mentorships' }}
            >
              {mentorshipsQuery.isPending ? (
                <SectionSkeleton rows={2} />
              ) : mentorships.length === 0 ? (
                <EmptyState>
                  Continue with a mentor after a session to start a mentorship.
                </EmptyState>
              ) : (
                <ul className="space-y-1">
                  {mentorships.slice(0, 4).map((mentorship) => {
                    const goal = mentorship.goals.find(
                      (item) => item.status === 'ACTIVE',
                    )
                    return (
                      <li key={mentorship.id}>
                        <Link
                          to="/apprentice/mentorships/$mentorshipId"
                          params={{ mentorshipId: mentorship.id }}
                          className="block rounded-md px-2 py-2 transition-colors hover:bg-accent"
                        >
                          <span className="block truncate text-sm font-medium">
                            {mentorship.mentorDisplayName ?? 'Mentor'} ·{' '}
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
