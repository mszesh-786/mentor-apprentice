import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMyBlocks, useUnblockUser } from '@/api/blocks'
import { useAuth } from '@/auth/auth-context'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'
import { useState } from 'react'

export function BlocksPage() {
  const { session } = useAuth()
  const home = session?.activeRole === 'MENTOR' ? '/mentor' : '/apprentice'
  const listQuery = useMyBlocks()
  const unblock = useUnblockUser()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onUnblock(blockedUserId: string) {
    setMessage(null)
    setError(null)
    try {
      await unblock.mutateAsync(blockedUserId)
      setMessage('User unblocked')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Blocked users">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Blocked users
            </h1>
            <p className="text-muted-foreground">
              Blocked people stay out of discovery. They are not notified.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={home}>Back</Link>
          </Button>
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

        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load blocks</AlertTitle>
            <AlertDescription>{errorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
          <Alert>
            <AlertTitle>No blocked users</AlertTitle>
            <AlertDescription>
              You can block someone from a mentorship or mentor profile.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((entry) => (
            <Card key={entry.blockedUserId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {entry.blockedDisplayName ?? 'User'}
                </CardTitle>
                <CardDescription>
                  Blocked {formatWhen(entry.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unblock.isPending}
                  onClick={() => void onUnblock(entry.blockedUserId)}
                >
                  Unblock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
