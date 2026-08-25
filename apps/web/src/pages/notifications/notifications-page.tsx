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
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/api/notifications'
import { useAuth } from '@/auth/auth-context'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

function targetPath(
  notification: {
    type: string
    relatedEntityType: string
    relatedEntityId: string
  },
  activeRole: 'MENTOR' | 'APPRENTICE',
): string | null {
  if (notification.relatedEntityType === 'SESSION') {
    return activeRole === 'MENTOR'
      ? `/mentor/sessions/${notification.relatedEntityId}`
      : `/apprentice/sessions/${notification.relatedEntityId}`
  }

  if (notification.relatedEntityType === 'BOOKING') {
    return activeRole === 'MENTOR' ? '/mentor/bookings' : '/apprentice/bookings'
  }

  return null
}

export function NotificationsPage() {
  const { session } = useAuth()
  const home = session?.activeRole === 'MENTOR' ? '/mentor' : '/apprentice'
  const listQuery = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  async function onOpenNotification(notificationId: string) {
    try {
      await markRead.mutateAsync(notificationId)
    } catch {
      // list still useful even if mark-read fails
    }
  }

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-muted-foreground">
              In-app updates about bookings and completed sessions.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={home}>Back</Link>
          </Button>
        </div>

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => void markAllRead.mutateAsync()}
          >
            {markAllRead.isPending ? 'Updating…' : 'Mark all read'}
          </Button>
        </div>

        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load notifications</AlertTitle>
            <AlertDescription>{errorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
          <Alert>
            <AlertTitle>All caught up</AlertTitle>
            <AlertDescription>
              Booking and session updates will appear here.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((notification) => {
            const href =
              session?.activeRole &&
              targetPath(notification, session.activeRole)

            return (
              <Card key={notification.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {notification.title}
                      </CardTitle>
                      <CardDescription>
                        {formatWhen(notification.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        notification.status === 'UNREAD'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {notification.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{notification.body}</p>
                  {href ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to={href}
                        onClick={() =>
                          void onOpenNotification(notification.id)
                        }
                      >
                        Open
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markRead.isPending}
                      onClick={() => void onOpenNotification(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
