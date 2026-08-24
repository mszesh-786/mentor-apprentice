import { useState } from 'react'
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
import { useCancelBooking, useMyBookings } from '@/api/bookings'
import { errorMessage } from '@/lib/errors'

function formatWhen(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString()
  }
}

export function ApprenticeBookingsPage() {
  const bookingsQuery = useMyBookings()
  const cancelBooking = useCancelBooking()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onCancel(id: string) {
    setMessage(null)
    setError(null)
    try {
      await cancelBooking.mutateAsync(id)
      setMessage('Booking cancelled')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Apprentice · Bookings">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My bookings
            </h1>
            <p className="text-muted-foreground">
              Requests and upcoming sessions with mentors.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/apprentice/discover">Discover</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/apprentice">Back</Link>
            </Button>
          </div>
        </div>

        {message ? (
          <Alert>
            <AlertTitle>Updated</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {bookingsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {bookingsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load bookings</AlertTitle>
            <AlertDescription>
              {errorMessage(bookingsQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {(bookingsQuery.data ?? []).length === 0 && !bookingsQuery.isLoading ? (
          <Alert>
            <AlertTitle>No bookings yet</AlertTitle>
            <AlertDescription>
              <Link to="/apprentice/discover" className="underline">
                Discover mentors
              </Link>{' '}
              to request a session.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(bookingsQuery.data ?? []).map((booking) => {
            const canCancel =
              booking.status === 'REQUESTED' ||
              booking.status === 'ACCEPTED' ||
              booking.status === 'CONFIRMED'
            return (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.mentorDisplayName ?? 'Mentor'}
                      </CardTitle>
                      <CardDescription>{booking.skillName}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        booking.status === 'CANCELLED' ||
                        booking.status === 'DECLINED'
                          ? 'outline'
                          : 'default'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    {formatWhen(booking.startAt, booking.timezoneSnapshot)} →{' '}
                    {formatWhen(booking.endAt, booking.timezoneSnapshot)}
                  </p>
                  <p className="text-muted-foreground">
                    TZ: {booking.timezoneSnapshot}
                  </p>
                  {booking.apprenticeMessage ? (
                    <p>Message: {booking.apprenticeMessage}</p>
                  ) : null}
                  {canCancel ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelBooking.isPending}
                      onClick={() => void onCancel(booking.id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
