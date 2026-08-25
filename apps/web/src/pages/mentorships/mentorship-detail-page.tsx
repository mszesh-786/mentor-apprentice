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
import { useBlockUser } from '@/api/blocks'
import {
  useAchieveMentorshipGoal,
  useCancelMentorshipGoal,
  useCompleteMentorship,
  useEndMentorship,
  useMentorship,
  useMentorshipBookings,
  useMentorshipSessions,
  usePauseMentorship,
  useResumeMentorship,
  useUpsertMentorshipGoal,
} from '@/api/mentorships'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

export function MentorshipDetailPage({
  role,
}: {
  role: 'MENTOR' | 'APPRENTICE'
}) {
  const isMentor = role === 'MENTOR'
  const base = isMentor ? '/mentor' : '/apprentice'
  const { mentorshipId } = useParams({
    from: isMentor
      ? '/mentor/mentorships/$mentorshipId'
      : '/apprentice/mentorships/$mentorshipId',
  })

  const mentorshipQuery = useMentorship(mentorshipId)
  const bookingsQuery = useMentorshipBookings(mentorshipId)
  const sessionsQuery = useMentorshipSessions(mentorshipId)
  const pause = usePauseMentorship()
  const resume = useResumeMentorship()
  const complete = useCompleteMentorship()
  const end = useEndMentorship()
  const upsertGoal = useUpsertMentorshipGoal()
  const achieveGoal = useAchieveMentorshipGoal()
  const cancelGoal = useCancelMentorshipGoal()
  const blockUser = useBlockUser()

  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mentorship = mentorshipQuery.data
  const activeGoal = mentorship?.goals.find((g) => g.status === 'ACTIVE')
  const counterpartUserId = isMentor
    ? mentorship?.apprenticeUserId
    : mentorship?.mentorUserId

  useEffect(() => {
    if (!activeGoal) return
    setGoalTitle(activeGoal.title)
    setGoalDescription(activeGoal.description ?? '')
  }, [activeGoal])

  const pending =
    pause.isPending ||
    resume.isPending ||
    complete.isPending ||
    end.isPending ||
    upsertGoal.isPending ||
    achieveGoal.isPending ||
    cancelGoal.isPending ||
    blockUser.isPending

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

  async function onBlock() {
    if (!counterpartUserId) return
    const confirmed = window.confirm(
      'Block this person? Active mentorships end, open bookings cancel, and they disappear from discovery. They will not be notified.',
    )
    if (!confirmed) return
    await run('User blocked', () => blockUser.mutateAsync(counterpartUserId))
  }

  async function onSaveGoal(event: React.FormEvent) {
    event.preventDefault()
    if (!mentorship || !goalTitle.trim()) return
    await run('Goal saved', () =>
      upsertGoal.mutateAsync({
        id: mentorship.id,
        body: {
          title: goalTitle.trim(),
          description: goalDescription.trim() || undefined,
        },
      }),
    )
  }

  const counterpart = isMentor
    ? mentorship?.apprenticeDisplayName
    : mentorship?.mentorDisplayName

  return (
    <AppShell title={`${isMentor ? 'Mentor' : 'Apprentice'} · Mentorship`}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {counterpart ?? 'Mentorship'}
            </h1>
            <p className="text-muted-foreground">
              {mentorship
                ? `${mentorship.primarySkillName} · ${formatWhen(mentorship.startedAt)}`
                : 'Loading…'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`${base}/mentorships`}>Back</Link>
          </Button>
        </div>

        {mentorshipQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentorship</AlertTitle>
            <AlertDescription>
              {errorMessage(mentorshipQuery.error)}
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

        {mentorship ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Skill: {mentorship.primarySkillName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge
                  variant={
                    mentorship.status === 'ACTIVE' ? 'default' : 'outline'
                  }
                >
                  {mentorship.status}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  {mentorship.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        void run('Paused', () => pause.mutateAsync(mentorship.id))
                      }
                    >
                      Pause
                    </Button>
                  ) : null}
                  {mentorship.status === 'PAUSED' ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        void run('Resumed', () =>
                          resume.mutateAsync(mentorship.id),
                        )
                      }
                    >
                      Resume
                    </Button>
                  ) : null}
                  {mentorship.status === 'ACTIVE' ||
                  mentorship.status === 'PAUSED' ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          void run('Completed', () =>
                            complete.mutateAsync(mentorship.id),
                          )
                        }
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          void run('Ended', () => end.mutateAsync(mentorship.id))
                        }
                      >
                        End
                      </Button>
                    </>
                  ) : null}
                </div>
                {counterpartUserId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void onBlock()}
                  >
                    Block user
                  </Button>
                ) : null}
                {!isMentor && mentorship.status === 'ACTIVE' ? (
                  <Button asChild>
                    <Link
                      to="/apprentice/discover/$profileId"
                      params={{ profileId: mentorship.mentorProfileId }}
                    >
                      Book another session
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning goal</CardTitle>
                <CardDescription>
                  Shared goal for this mentorship.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(mentorship.goals ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {mentorship.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          {goal.description ? (
                            <p className="text-muted-foreground">
                              {goal.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{goal.status}</Badge>
                          {goal.status === 'ACTIVE' ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={pending}
                                onClick={() =>
                                  void run('Goal achieved', () =>
                                    achieveGoal.mutateAsync({
                                      id: mentorship.id,
                                      goalId: goal.id,
                                    }),
                                  )
                                }
                              >
                                Achieve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() =>
                                  void run('Goal cancelled', () =>
                                    cancelGoal.mutateAsync({
                                      id: mentorship.id,
                                      goalId: goal.id,
                                    }),
                                  )
                                }
                              >
                                Cancel
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mentorship.status === 'ACTIVE' ||
                mentorship.status === 'PAUSED' ? (
                  <form className="space-y-3" onSubmit={onSaveGoal}>
                    <div className="space-y-2">
                      <Label htmlFor="goalTitle">Goal title</Label>
                      <Input
                        id="goalTitle"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="Build confidence with hand tools"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalDescription">
                        Description (optional)
                      </Label>
                      <Input
                        id="goalDescription"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        placeholder="Safe cuts and measuring"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={pending || goalTitle.trim().length === 0}
                    >
                      {upsertGoal.isPending ? 'Saving…' : 'Save goal'}
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bookingsQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : null}
                {(bookingsQuery.data ?? []).length === 0 &&
                !bookingsQuery.isLoading ? (
                  <p className="text-muted-foreground">None yet.</p>
                ) : null}
                {(bookingsQuery.data ?? []).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <span>
                      {formatWhen(booking.startAt)} → {formatWhen(booking.endAt)}
                    </span>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sessionsQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : null}
                {(sessionsQuery.data ?? []).length === 0 &&
                !sessionsQuery.isLoading ? (
                  <p className="text-muted-foreground">None yet.</p>
                ) : null}
                {(sessionsQuery.data ?? []).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <span>
                      {session.startedAt
                        ? formatWhen(session.startedAt)
                        : session.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.status}</Badge>
                      {isMentor ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to="/mentor/sessions/$sessionId"
                            params={{ sessionId: session.id }}
                          >
                            Open
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to="/apprentice/sessions/$sessionId"
                            params={{ sessionId: session.id }}
                          >
                            Open
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
