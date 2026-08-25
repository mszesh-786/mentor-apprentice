import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmitSessionFeedback } from '@/api/feedback'
import { useContinueFromSession } from '@/api/mentorships'
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
  const navigate = useNavigate()
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
  const continueMentorship = useContinueFromSession()
  const submitFeedback = useSubmitSessionFeedback()

  const [summary, setSummary] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [wasUseful, setWasUseful] = useState<boolean | null>(null)
  const [explanationsClear, setExplanationsClear] = useState<boolean | null>(
    null,
  )
  const [progressMade, setProgressMade] = useState<boolean | null>(null)
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null)
  const [apprenticeRespectful, setApprenticeRespectful] = useState<
    boolean | null
  >(null)
  const [learningGoalClear, setLearningGoalClear] = useState<boolean | null>(
    null,
  )
  const [wouldMentorAgain, setWouldMentorAgain] = useState<boolean | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [continueTitle, setContinueTitle] = useState('')
  const [continueDescription, setContinueDescription] = useState('')
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

  async function onSubmitFeedback(event: React.FormEvent) {
    event.preventDefault()
    if (!session) return
    setMessage(null)
    setError(null)
    try {
      if (isMentor) {
        if (
          apprenticeRespectful === null ||
          learningGoalClear === null ||
          wouldMentorAgain === null
        ) {
          setError('Answer all feedback questions')
          return
        }
        await submitFeedback.mutateAsync({
          sessionId: session.id,
          body: {
            apprenticeRespectful,
            learningGoalClear,
            wouldMentorAgain,
            comment: feedbackComment.trim() || undefined,
          },
        })
      } else {
        if (
          wasUseful === null ||
          explanationsClear === null ||
          progressMade === null ||
          wouldBookAgain === null
        ) {
          setError('Answer all feedback questions')
          return
        }
        await submitFeedback.mutateAsync({
          sessionId: session.id,
          body: {
            wasUseful,
            explanationsClear,
            progressMade,
            wouldBookAgain,
            comment: feedbackComment.trim() || undefined,
          },
        })
      }
      setMessage('Feedback submitted')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onContinue(event: React.FormEvent) {
    event.preventDefault()
    if (!session) return
    setMessage(null)
    setError(null)
    try {
      const mentorship = await continueMentorship.mutateAsync({
        sessionId: session.id,
        body: {
          title: continueTitle.trim() || undefined,
          description: continueDescription.trim() || undefined,
        },
      })
      setMessage('Mentorship continued')
      if (isMentor) {
        void navigate({
          to: '/mentor/mentorships/$mentorshipId',
          params: { mentorshipId: mentorship.id },
        })
      } else {
        void navigate({
          to: '/apprentice/mentorships/$mentorshipId',
          params: { mentorshipId: mentorship.id },
        })
      }
    } catch (err) {
      setError(errorMessage(err))
    }
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

            {session.status === 'COMPLETED' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Session feedback</CardTitle>
                  <CardDescription>
                    Lightweight reflection on this session (once per person).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {session.myFeedbackSubmitted ? (
                    <Alert>
                      <AlertTitle>Thanks</AlertTitle>
                      <AlertDescription>
                        Your feedback for this session is recorded.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form className="space-y-4" onSubmit={onSubmitFeedback}>
                      {isMentor ? (
                        <>
                          <YesNoField
                            id="apprenticeRespectful"
                            label="Was the apprentice respectful?"
                            value={apprenticeRespectful}
                            onChange={setApprenticeRespectful}
                          />
                          <YesNoField
                            id="learningGoalClear"
                            label="Was the learning goal clear?"
                            value={learningGoalClear}
                            onChange={setLearningGoalClear}
                          />
                          <YesNoField
                            id="wouldMentorAgain"
                            label="Would you mentor this apprentice again?"
                            value={wouldMentorAgain}
                            onChange={setWouldMentorAgain}
                          />
                        </>
                      ) : (
                        <>
                          <YesNoField
                            id="wasUseful"
                            label="Was the session useful?"
                            value={wasUseful}
                            onChange={setWasUseful}
                          />
                          <YesNoField
                            id="explanationsClear"
                            label="Were explanations clear?"
                            value={explanationsClear}
                            onChange={setExplanationsClear}
                          />
                          <YesNoField
                            id="progressMade"
                            label="Did you make progress toward your goal?"
                            value={progressMade}
                            onChange={setProgressMade}
                          />
                          <YesNoField
                            id="wouldBookAgain"
                            label="Would you book this mentor again?"
                            value={wouldBookAgain}
                            onChange={setWouldBookAgain}
                          />
                        </>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="feedbackComment">
                          Comment (optional)
                        </Label>
                        <Input
                          id="feedbackComment"
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Anything else to share?"
                        />
                      </div>
                      <Button type="submit" disabled={submitFeedback.isPending}>
                        {submitFeedback.isPending
                          ? 'Submitting…'
                          : 'Submit feedback'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {session.status === 'COMPLETED' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Continue mentorship</CardTitle>
                  <CardDescription>
                    Start or reopen an ongoing relationship with an optional
                    shared goal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={onContinue}>
                    <div className="space-y-2">
                      <Label htmlFor="continueTitle">
                        Goal title (optional)
                      </Label>
                      <Input
                        id="continueTitle"
                        value={continueTitle}
                        onChange={(e) => setContinueTitle(e.target.value)}
                        placeholder="Routine maintenance confidence"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="continueDescription">
                        Goal description (optional)
                      </Label>
                      <Input
                        id="continueDescription"
                        value={continueDescription}
                        onChange={(e) =>
                          setContinueDescription(e.target.value)
                        }
                        placeholder="Build independence on common tasks"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={continueMentorship.isPending}
                    >
                      {continueMentorship.isPending
                        ? 'Continuing…'
                        : 'Continue with this mentor'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

function YesNoField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: boolean | null
  onChange: (value: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value === null ? '' : value ? 'yes' : 'no'}
        onValueChange={(next) => onChange(next === 'yes')}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select yes or no" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
