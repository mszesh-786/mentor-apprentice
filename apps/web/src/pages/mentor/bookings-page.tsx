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
import {
  useAcceptBooking,
  useCancelBooking,
  useDeclineBooking,
  useMyBookings,
} from '@/api/bookings'
import { useSessionForBooking } from '@/api/sessions'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

function BookingSessionLink({ bookingId }: { bookingId: string }) {
  const sessionQuery = useSessionForBooking(bookingId)
  if (sessionQuery.isLoading) {
    return <span className="text-sm text-muted-foreground">Session…</span>
  }
  if (!sessionQuery.data) return null
  return (
    <Button variant="secondary" size="sm" asChild>
      <Link
        to="/mentor/sessions/$sessionId"
        params={{ sessionId: sessionQuery.data.id }}
      >
        Open session
      </Link>
    </Button>
  )
}

export function MentorBookingsPage() {
  const bookingsQuery = useMyBookings()
  const acceptBooking = useAcceptBooking()
  const declineBooking = useDeclineBooking()
  const cancelBooking = useCancelBooking()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pending =
    acceptBooking.isPending ||
    declineBooking.isPending ||
    cancelBooking.isPending

  async function onAccept(id: string) {
    setMessage(null)
    setError(null)
    try {
      await acceptBooking.mutateAsync(id)
      setMessage('Booking accepted — session is ready')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onDecline(id: string) {
    setMessage(null)
    setError(null)
    try {
      await declineBooking.mutateAsync(id)
      setMessage('Booking declined')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

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
    <AppShell title="Mentor · Bookings">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Booking inbox
            </h1>
            <p className="text-muted-foreground">
              Accept requests to create a mentoring session.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/mentor/sessions">Sessions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/mentor">Back</Link>
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
              Requests from apprentices appear here.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(bookingsQuery.data ?? []).map((booking) => {
            const isRequested = booking.status === 'REQUESTED'
            const canCancel =
              booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED'
            const hasSession =
              booking.status === 'ACCEPTED' ||
              booking.status === 'CONFIRMED' ||
              booking.status === 'COMPLETED' ||
              booking.status === 'NO_SHOW'
            return (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.apprenticeDisplayName ?? 'Apprentice'}
                      </CardTitle>
                      <CardDescription>{booking.skillName}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        booking.status === 'REQUESTED' ? 'default' : 'outline'
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
                  {booking.apprenticeMessage ? (
                    <p>Message: {booking.apprenticeMessage}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {isRequested ? (
                      <>
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => void onAccept(booking.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => void onDecline(booking.id)}
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                    {canCancel ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => void onCancel(booking.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    {hasSession ? (
                      <BookingSessionLink bookingId={booking.id} />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
