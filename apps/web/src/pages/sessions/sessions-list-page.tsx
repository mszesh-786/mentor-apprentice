import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMySessions } from '@/api/sessions'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

export function SessionsListPage({
  role,
}: {
  role: 'MENTOR' | 'APPRENTICE'
}) {
  const isMentor = role === 'MENTOR'
  const sessionsQuery = useMySessions()

  return (
    <AppShell title={`${isMentor ? 'Mentor' : 'Apprentice'} · Sessions`}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">
              Join stub video rooms for accepted bookings.
            </p>
          </div>
          <div className="flex gap-2">
            {isMentor ? (
              <Button variant="outline" asChild>
                <Link to="/mentor/bookings">Inbox</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/apprentice/bookings">Bookings</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={isMentor ? '/mentor' : '/apprentice'}>Back</Link>
            </Button>
          </div>
        </div>

        {sessionsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {sessionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load sessions</AlertTitle>
            <AlertDescription>
              {errorMessage(sessionsQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {(sessionsQuery.data ?? []).length === 0 && !sessionsQuery.isLoading ? (
          <Alert>
            <AlertTitle>No sessions yet</AlertTitle>
            <AlertDescription>
              {isMentor
                ? 'Accept a booking request to create a session.'
                : 'A session appears after the mentor accepts your booking.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(sessionsQuery.data ?? []).map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {formatWhen(session.bookingStartAt)}
                    </CardTitle>
                    <CardDescription>
                      Booking {session.bookingId.slice(0, 8)}…
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      session.status === 'COMPLETED'
                        ? 'default'
                        : session.status === 'FAILED'
                          ? 'outline'
                          : 'secondary'
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-muted-foreground">
                  Ends {formatWhen(session.bookingEndAt)}
                  {session.failureReason
                    ? ` · ${session.failureReason}`
                    : ''}
                </p>
                {isMentor ? (
                  <Button size="sm" asChild>
                    <Link
                      to="/mentor/sessions/$sessionId"
                      params={{ sessionId: session.id }}
                    >
                      Open
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" asChild>
                    <Link
                      to="/apprentice/sessions/$sessionId"
                      params={{ sessionId: session.id }}
                    >
                      Open
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
