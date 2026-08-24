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
import { useApprenticeProfile } from '@/api/apprentices'
import { useMyBookings } from '@/api/bookings'
import { useAuth } from '@/auth/auth-context'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/lib/errors'

export function ApprenticeHomePage() {
  const { session } = useAuth()
  const profileQuery = useApprenticeProfile()
  const bookingsQuery = useMyBookings()
  const profile = profileQuery.data
  const openCount =
    bookingsQuery.data?.filter(
      (item) =>
        item.status === 'REQUESTED' ||
        item.status === 'ACCEPTED' ||
        item.status === 'CONFIRMED',
    ).length ?? 0

  return (
    <AppShell title="Apprentice">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Apprentice home
          </h1>
          <p className="text-muted-foreground">
            Create a profile, discover mentors, and request bookings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Stub JWT identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">{session?.email}</Badge>
            <Badge>{session?.activeRole}</Badge>
            {profile ? (
              <Badge variant="secondary">Profile ready</Badge>
            ) : (
              <Badge variant="outline">No profile yet</Badge>
            )}
            <Badge variant="outline">{openCount} open booking(s)</Badge>
          </CardContent>
        </Card>

        {profileQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load apprentice profile</AlertTitle>
            <AlertDescription>
              {profileQuery.error instanceof ApiError
                ? profileQuery.error.message
                : errorMessage(profileQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant={profile ? 'default' : 'outline'}>
                  {profile ? 'Done' : 'Todo'}
                </Badge>
                <span className="text-sm font-medium">Profile</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/apprentice/profile">Open</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Go</Badge>
                <span className="text-sm font-medium">Discover mentors</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/apprentice/discover">Open</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant={openCount > 0 ? 'default' : 'outline'}>
                  {openCount > 0 ? `${openCount} open` : 'None'}
                </Badge>
                <span className="text-sm font-medium">My bookings</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/apprentice/bookings">Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
