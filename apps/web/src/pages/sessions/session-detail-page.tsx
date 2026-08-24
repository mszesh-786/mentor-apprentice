import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCompleteSession,
  useJoinSession,
  useReportNoShow,
  useReportTechnicalFailure,
  useSession,
  useUpsertSessionSummary,
} from '@/api/sessions'
import { formatWhen, isWithinDefaultJoinWindow } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

export function SessionDetailPage({
  role,
}: {
  role: 'MENTOR' | 'APPRENTICE'
}) {
  const base = role === 'MENTOR' ? '/mentor' : '/apprentice'
  const { sessionId } = useParams({
    from:
      role === 'MENTOR'
        ? '/mentor/sessions/$sessionId'
        : '/apprentice/sessions/$sessionId',
  })
  const sessionQuery = useSession(sessionId)
  const joinSession = useJoinSession()
  const completeSession = useCompleteSession()
  const reportNoShow = useReportNoShow()
  const reportTech = useReportTechnicalFailure()
  const upsertSummary = useUpsertSessionSummary()

  const [summary, setSummary] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const session = sessionQuery.data
  const isMentor = role === 'MENTOR'

  useEffect(() => {
    if (!session?.summary) return
    setSummary(session.summary.summary)
    setNextStep(session.summary.nextStep ?? '')
  }, [session?.summary])

  const active =
    session?.status === 'READY' || session?.status === 'IN_PROGRESS'
  const bothJoined = Boolean(
    session?.mentorJoinedAt && session?.apprenticeJoinedAt,
  )
  const inWindow = session
    ? isWithinDefaultJoinWindow(session.bookingStartAt, session.bookingEndAt)
    : false
  const alreadyJoined = isMentor
    ? Boolean(session?.mentorJoinedAt)
    : Boolean(session?.apprenticeJoinedAt)

  async function run(label: string, action: () => Promise<unknown>) {
    setMessage(null)
    setError(null)
    try {
      await action()
      setMessage(label)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onSaveSummary(event: React.FormEvent) {
    event.preventDefault()
    if (!session || !summary.trim()) return
    await run('Summary saved', () =>
      upsertSummary.mutateAsync({
        sessionId: session.id,
        body: {
          summary: summary.trim(),
          nextStep: nextStep.trim() || undefined,
        },
      }),
    )
  }

  return (
    <AppShell title={`${isMentor ? 'Mentor' : 'Apprentice'} · Session`}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Session</h1>
            <p className="text-muted-foreground">
              {session
                ? `${formatWhen(session.bookingStartAt)} → ${formatWhen(session.bookingEndAt)}`
                : 'Loading…'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`${base}/sessions`}>Back</Link>
          </Button>
        </div>

        {sessionQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load session</AlertTitle>
            <AlertDescription>
              {errorMessage(sessionQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

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

        {session ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Stub video · {session.videoProvider}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge>{session.status}</Badge>
                  {session.failureReason ? (
                    <Badge variant="outline">{session.failureReason}</Badge>
                  ) : null}
                </div>
                <p>
                  Mentor joined:{' '}
                  {session.mentorJoinedAt
                    ? formatWhen(session.mentorJoinedAt)
                    : '—'}
                </p>
                <p>
                  Apprentice joined:{' '}
                  {session.apprenticeJoinedAt
                    ? formatWhen(session.apprenticeJoinedAt)
                    : '—'}
                </p>
                <p className="text-muted-foreground">
                  Join window: 15 min before start until 30 min after end
                  {inWindow ? ' · open now' : ' · closed / not yet open'}
                </p>
                <p className="break-all text-muted-foreground">
                  Room: {session.joinUrl}
                </p>
              </CardContent>
            </Card>

            {active ? (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    disabled={joinSession.isPending || alreadyJoined}
                    onClick={() =>
                      void run('Joined session', () =>
                        joinSession.mutateAsync(session.id),
                      )
                    }
                  >
                    {alreadyJoined
                      ? 'Already joined'
                      : joinSession.isPending
                        ? 'Joining…'
                        : 'Join'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(session.joinUrl, '_blank', 'noopener')
                    }
                  >
                    Open video link
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={completeSession.isPending || !bothJoined}
                    onClick={() =>
                      void run('Session completed', () =>
                        completeSession.mutateAsync(session.id),
                      )
                    }
                  >
                    {completeSession.isPending ? 'Completing…' : 'Complete'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={reportNoShow.isPending}
                    onClick={() =>
                      void run('Marked no-show', () =>
                        reportNoShow.mutateAsync(session.id),
                      )
                    }
                  >
                    Report no-show
                  </Button>
                  <Button
                    variant="outline"
                    disabled={reportTech.isPending}
                    onClick={() =>
                      void run('Technical failure reported', () =>
                        reportTech.mutateAsync(session.id),
                      )
                    }
                  >
                    Tech failure
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {session.status === 'COMPLETED' && isMentor ? (
              <Card>
                <CardHeader>
                  <CardTitle>Session summary</CardTitle>
                  <CardDescription>Mentor-only notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={onSaveSummary}>
                    <div className="space-y-2">
                      <Label htmlFor="summary">Summary</Label>
                      <Input
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="What you covered"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextStep">Next step (optional)</Label>
                      <Input
                        id="nextStep"
                        value={nextStep}
                        onChange={(e) => setNextStep(e.target.value)}
                        placeholder="Practice filter swap"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={
                        upsertSummary.isPending || summary.trim().length === 0
                      }
                    >
                      {upsertSummary.isPending ? 'Saving…' : 'Save summary'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {session.summary && !isMentor ? (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{session.summary.summary}</p>
                  {session.summary.nextStep ? (
                    <p className="text-muted-foreground">
                      Next: {session.summary.nextStep}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
