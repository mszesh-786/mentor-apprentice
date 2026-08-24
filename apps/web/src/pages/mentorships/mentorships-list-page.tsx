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
import { useMyMentorships } from '@/api/mentorships'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

export function MentorshipsListPage({
  role,
}: {
  role: 'MENTOR' | 'APPRENTICE'
}) {
  const isMentor = role === 'MENTOR'
  const listQuery = useMyMentorships()

  return (
    <AppShell title={`${isMentor ? 'Mentor' : 'Apprentice'} · Mentorships`}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Mentorships
            </h1>
            <p className="text-muted-foreground">
              Ongoing relationships after continuing past a completed session.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={isMentor ? '/mentor' : '/apprentice'}>Back</Link>
          </Button>
        </div>

        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentorships</AlertTitle>
            <AlertDescription>
              {errorMessage(listQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
          <Alert>
            <AlertTitle>No mentorships yet</AlertTitle>
            <AlertDescription>
              After a completed session, choose Continue to start a
              relationship.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((item) => {
            const counterpart = isMentor
              ? item.apprenticeDisplayName
              : item.mentorDisplayName
            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {counterpart ?? 'Partner'}
                      </CardTitle>
                      <CardDescription>
                        {item.primarySkillName} · started{' '}
                        {formatWhen(item.startedAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        item.status === 'ACTIVE' ? 'default' : 'outline'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-end">
                  {isMentor ? (
                    <Button size="sm" asChild>
                      <Link
                        to="/mentor/mentorships/$mentorshipId"
                        params={{ mentorshipId: item.id }}
                      >
                        Open
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <Link
                        to="/apprentice/mentorships/$mentorshipId"
                        params={{ mentorshipId: item.id }}
                      >
                        Open
                      </Link>
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
