import { useMemo, useState } from 'react'
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
import { useApprenticeProfile } from '@/api/apprentices'
import { useBlockUser } from '@/api/blocks'
import { useCreateBooking } from '@/api/bookings'
import { useDiscoveryMentor, useMentorSlots } from '@/api/discovery'
import type { BookingDuration } from '@/api/types'
import { BOOKING_DURATIONS } from '@/api/types'
import { errorMessage } from '@/lib/errors'
import { ReportUserForm } from '@/pages/reports/report-user-form'

function formatSlot(iso: string, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timeZone ?? undefined,
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString()
  }
}

export function ApprenticeMentorDetailPage() {
  const { profileId } = useParams({
    from: '/apprentice/discover/$profileId',
  })
  const navigate = useNavigate()
  const detailQuery = useDiscoveryMentor(profileId)
  const apprenticeQuery = useApprenticeProfile()
  const createBooking = useCreateBooking()
  const blockUser = useBlockUser()

  const [skillId, setSkillId] = useState('')
  const [durationMinutes, setDurationMinutes] =
    useState<BookingDuration>(30)
  const [selectedStartAt, setSelectedStartAt] = useState<string>('')
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => {
    const from = new Date()
    from.setMinutes(0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  const slotsQuery = useMentorSlots(
    profileId,
    range.from,
    range.to,
    durationMinutes,
    Boolean(detailQuery.data),
  )

  const detail = detailQuery.data
  const resolvedSkillId =
    skillId || detail?.expertise[0]?.skillId || ''

  async function onBlock() {
    if (!detail?.userId) return
    const confirmed = window.confirm(
      'Block this mentor? Open bookings cancel and they disappear from discovery. They will not be notified.',
    )
    if (!confirmed) return
    setFeedback(null)
    setError(null)
    try {
      await blockUser.mutateAsync(detail.userId)
      setFeedback('Mentor blocked')
      void navigate({ to: '/apprentice/discover' })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onBook() {
    setFeedback(null)
    setError(null)
    if (!apprenticeQuery.data) {
      setError('Create an apprentice profile before booking.')
      return
    }
    if (!resolvedSkillId || !selectedStartAt) {
      setError('Pick a skill and a time slot.')
      return
    }
    try {
      const booking = await createBooking.mutateAsync({
        mentorProfileId: profileId,
        skillId: resolvedSkillId,
        startAt: selectedStartAt,
        durationMinutes,
        apprenticeMessage: message.trim() || undefined,
      })
      setFeedback(`Booking requested (${booking.status})`)
      void navigate({ to: '/apprentice/bookings' })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Apprentice · Mentor">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {detail?.displayName ?? 'Mentor'}
            </h1>
            <p className="text-muted-foreground">
              {detail?.headline ?? 'Loading profile…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {detail?.userId ? (
              <Button
                variant="outline"
                disabled={blockUser.isPending}
                onClick={() => void onBlock()}
              >
                Block
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/apprentice/discover">Back</Link>
            </Button>
          </div>
        </div>

        {detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentor</AlertTitle>
            <AlertDescription>
              {errorMessage(detailQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {detail ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>
                  {[detail.generalLocation, detail.timezone]
                    .filter(Boolean)
                    .join(' · ') || 'Location not set'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{detail.biography ?? 'No biography provided.'}</p>
                <div className="flex flex-wrap gap-2">
                  {detail.languages.map((lang) => (
                    <Badge key={lang.id} variant="outline">
                      {lang.name}
                    </Badge>
                  ))}
                  {detail.identityVerified ? (
                    <Badge>Identity verified</Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Expertise</p>
                  {detail.expertise.map((item) => (
                    <div
                      key={item.skillId}
                      className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <span>{item.skillName}</span>
                      <Badge variant="outline">{item.teachingLevel}</Badge>
                      <Badge variant="secondary">
                        {item.yearsExperience} yrs
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Weekly availability</p>
                  {detail.availability.length === 0 ? (
                    <p className="text-muted-foreground">None listed.</p>
                  ) : (
                    detail.availability.map((rule) => (
                      <p key={`${rule.dayOfWeek}-${rule.startTime}`}>
                        {rule.dayOfWeek} {rule.startTime}–{rule.endTime} (
                        {rule.timezone})
                      </p>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {!apprenticeQuery.data ? (
              <Alert>
                <AlertTitle>Profile required</AlertTitle>
                <AlertDescription>
                  <Link to="/apprentice/profile" className="underline">
                    Create your apprentice profile
                  </Link>{' '}
                  before booking.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Book a session</CardTitle>
                <CardDescription>
                  Slots for the next 14 days at the selected duration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Skill</Label>
                    <Select
                      value={resolvedSkillId}
                      onValueChange={setSkillId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {detail.expertise.map((item) => (
                          <SelectItem key={item.skillId} value={item.skillId}>
                            {item.skillName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={String(durationMinutes)}
                      onValueChange={(value) => {
                        setDurationMinutes(Number(value) as BookingDuration)
                        setSelectedStartAt('')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_DURATIONS.map((mins) => (
                          <SelectItem key={mins} value={String(mins)}>
                            {mins} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Available slots</Label>
                  {slotsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading slots…
                    </p>
                  ) : null}
                  {slotsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Slots failed</AlertTitle>
                      <AlertDescription>
                        {errorMessage(slotsQuery.error)}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {(slotsQuery.data ?? []).length === 0 &&
                  !slotsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      No open slots in the next 14 days.
                    </p>
                  ) : null}
                  <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                    {(slotsQuery.data ?? []).map((slot) => {
                      const selected = selectedStartAt === slot.startAt
                      return (
                        <Button
                          key={slot.startAt}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          className="justify-start"
                          data-testid="booking-slot"
                          onClick={() => setSelectedStartAt(slot.startAt)}
                        >
                          {formatSlot(slot.startAt, detail.timezone)}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apprenticeMessage">Message (optional)</Label>
                  <Input
                    id="apprenticeMessage"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What would you like to learn?"
                    maxLength={1000}
                  />
                </div>

                {feedback ? (
                  <Alert>
                    <AlertTitle>Requested</AlertTitle>
                    <AlertDescription>{feedback}</AlertDescription>
                  </Alert>
                ) : null}
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Booking failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  onClick={() => void onBook()}
                  disabled={
                    createBooking.isPending ||
                    !selectedStartAt ||
                    !apprenticeQuery.data
                  }
                >
                  {createBooking.isPending
                    ? 'Requesting…'
                    : 'Request booking'}
                </Button>
              </CardContent>
            </Card>

            {detail.userId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Report a safety concern</CardTitle>
                  <CardDescription>
                    Only available after you have booked or mentored with this
                    person.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportUserForm reportedUserId={detail.userId} />
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
