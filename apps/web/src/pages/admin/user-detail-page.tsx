import { Link, useParams } from '@tanstack/react-router'
import {
  useAdminUser,
  useSuspendUser,
  useUnsuspendUser,
} from '@/api/admin'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { formatWhen } from '@/lib/datetime'

export function AdminUserDetailPage() {
  const { userId } = useParams({ from: '/admin/users/$userId' })
  const detailQuery = useAdminUser(userId)
  const suspend = useSuspendUser()
  const unsuspend = useUnsuspendUser()
  const user = detailQuery.data

  return (
    <AppShell title="Admin user">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user?.displayName ?? 'User'}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/users">Back</Link>
          </Button>
        </div>

        {detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load user</AlertTitle>
            <AlertDescription>
              {errorMessage(detailQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {user ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{user.status}</Badge>
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
              <Badge variant="outline">
                email {user.emailVerified ? 'verified' : 'unverified'}
              </Badge>
            </div>
            <p>Joined {formatWhen(user.createdAt)}</p>
            <p>Open reports received: {user.openReportsReceived}</p>
            {user.mentorProfileId ? (
              <div className="space-y-1">
                <p>Mentor profile: {user.mentorProfileId}</p>
                <p>Publication: {user.mentorPublicationStatus ?? '—'}</p>
                <p>
                  Bookable hint:{' '}
                  {user.mentorIsBookable == null
                    ? '—'
                    : user.mentorIsBookable
                      ? 'yes'
                      : 'no'}
                </p>
                <p>Verification: {user.verificationStatus ?? '—'}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No mentor profile</p>
            )}
            <div className="flex gap-2 pt-2">
              {user.status === 'ACTIVE' ? (
                <Button
                  variant="destructive"
                  disabled={suspend.isPending}
                  onClick={() => void suspend.mutateAsync(user.id)}
                >
                  Suspend
                </Button>
              ) : null}
              {user.status === 'SUSPENDED' ? (
                <Button
                  disabled={unsuspend.isPending}
                  onClick={() => void unsuspend.mutateAsync(user.id)}
                >
                  Unsuspend
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
