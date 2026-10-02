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
import { useMyReports } from '@/api/reports'
import { useAuth } from '@/auth/auth-context'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

const reasonLabels: Record<string, string> = {
  HARASSMENT: 'Harassment',
  INAPPROPRIATE_BEHAVIOR: 'Inappropriate behavior',
  SAFETY_CONCERN: 'Safety concern',
  SPAM: 'Spam',
  OTHER: 'Other',
}

export function ReportsPage() {
  const { session } = useAuth()
  const home = session?.activeRole === 'MENTOR' ? '/mentor' : '/apprentice'
  const listQuery = useMyReports()

  return (
    <AppShell title="My reports">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My reports</h1>
            <p className="text-muted-foreground">
              Reports you submitted for review. Submitting a report does not
              automatically suspend the other person.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={home}>Back</Link>
          </Button>
        </div>

        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load reports</AlertTitle>
            <AlertDescription>{errorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
          <Alert>
            <AlertTitle>No reports yet</AlertTitle>
            <AlertDescription>
              You can report someone from a session or mentorship page if you
              have a safety concern.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {entry.reportedDisplayName ?? 'User'}
                </CardTitle>
                <CardDescription>
                  {reasonLabels[entry.reason] ?? entry.reason} ·{' '}
                  {formatWhen(entry.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="outline">{entry.status}</Badge>
                <p className="text-muted-foreground">{entry.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
