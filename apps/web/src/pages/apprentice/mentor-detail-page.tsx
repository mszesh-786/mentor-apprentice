import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BadgeCheck, CalendarCheck, MapPin } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { MentorAvatar } from '@/components/mentor-avatar'
import { RatingSummary, StarRow } from '@/components/star-rating'
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
import {
  useDiscoveryMentor,
  useMentorReviews,
  useMentorSlots,
} from '@/api/discovery'
import type { BookingDuration, DiscoveryMentorDetail } from '@/api/types'
import { BOOKING_DURATIONS } from '@/api/types'
import { formatTimeAgo } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'
import { formatHourlyRate } from '@/lib/format'
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

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

export function ApprenticeMentorDetailPage() {
  const { profileId } = useParams({
    from: '/apprentice/discover/$profileId',
  })
  const navigate = useNavigate()
  const detailQuery = useDiscoveryMentor(profileId)
  const blockUser = useBlockUser()
  const [error, setError] = useState<string | null>(null)

  const detail = detailQuery.data

  async function onBlock() {
    if (!detail?.userId) return
    const confirmed = window.confirm(
      'Block this mentor? Open bookings cancel and they disappear from discovery. They will not be notified.',
    )
    if (!confirmed) return
    setError(null)
    try {
      await blockUser.mutateAsync(detail.userId)
      void navigate({ to: '/apprentice/discover' })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Apprentice · Mentor">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" asChild>
            <Link to="/apprentice/discover">← Back to mentors</Link>
          </Button>
          {detail?.userId ? (
            <Button
              variant="outline"
              size="sm"
              disabled={blockUser.isPending}
              onClick={() => void onBlock()}
            >
              Block
            </Button>
          ) : null}
        </div>

        {detailQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : null}

        {detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentor</AlertTitle>
            <AlertDescription>{errorMessage(detailQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {detail ? (
          <>
            <MentorHeader detail={detail} />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <p className="whitespace-pre-line leading-relaxed">
                      {detail.biography ?? 'No biography provided.'}
                    </p>
                    {detail.languages.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Speaks</span>
                        {detail.languages.map((lang) => (
                          <Badge key={lang.id} variant="outline">
                            {lang.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expertise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {detail.expertise.map((item) => (
                      <div key={item.skillId} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{item.skillName}</span>
                          <Badge variant="outline">{item.teachingLevel}</Badge>
                          <Badge variant="secondary">
                            {item.yearsExperience} yrs
                          </Badge>
                        </div>
                        {item.description ? (
                          <p className="mt-1 text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly availability</CardTitle>
                    <CardDescription>
                      Times shown in the mentor&apos;s timezone
                      {detail.timezone ? ` (${detail.timezone})` : ''}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {detail.availability.length === 0 ? (
                      <p className="text-muted-foreground">None listed.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {detail.availability.map((rule) => (
                          <span
                            key={`${rule.dayOfWeek}-${rule.startTime}`}
                            className="rounded-md bg-muted px-2.5 py-1"
                          >
                            <span className="font-medium">
                              {DAY_LABELS[rule.dayOfWeek] ?? rule.dayOfWeek}
                            </span>{' '}
                            {rule.startTime}–{rule.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ReviewsSection detail={detail} />

                {detail.userId ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Report a safety concern</CardTitle>
                      <CardDescription>
                        Only available after you have booked or mentored with
                        this person.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ReportUserForm reportedUserId={detail.userId} />
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="lg:sticky lg:top-6">
                <BookingCard detail={detail} profileId={profileId} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

function MentorHeader({ detail }: { detail: DiscoveryMentorDetail }) {
  const rate = formatHourlyRate(detail.hourlyRate, detail.currency)
  const categories = [
    ...new Set(detail.expertise.map((item) => item.categoryName)),
  ]

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950" />
      <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
        <MentorAvatar
          name={detail.displayName}
          photoUrl={detail.profilePhotoUrl}
          className="-mt-12 size-24 border-4 border-card text-2xl"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {detail.displayName}
          </h1>
          <p className="text-muted-foreground">{detail.headline ?? 'Mentor'}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <RatingSummary
                averageRating={detail.averageRating}
                reviewCount={detail.reviewCount}
              />
              {detail.reviewCount > 0 ? (
                <a href="#reviews" className="text-muted-foreground underline">
                  {detail.reviewCount} review{detail.reviewCount === 1 ? '' : 's'}
                </a>
              ) : null}
            </span>
            {detail.generalLocation ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-4" />
                {detail.generalLocation}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarCheck className="size-4" />
              {detail.completedSessionCount} session
              {detail.completedSessionCount === 1 ? '' : 's'} completed
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="size-4" />
              Identity verified
            </span>
          </div>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          {rate ? (
            <p className="text-xl font-semibold">
              {rate}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / hour
              </span>
            </p>
          ) : null}
          <Button asChild className="lg:hidden">
            <a href="#book">Book a session</a>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ReviewsSection({ detail }: { detail: DiscoveryMentorDetail }) {
  const reviewsQuery = useMentorReviews(detail.id)
  const reviews = reviewsQuery.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <Card id="reviews" className="scroll-mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Reviews</CardTitle>
          {detail.averageRating !== null && detail.reviewCount > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl font-semibold">
                {detail.averageRating.toFixed(1)}
              </span>
              <StarRow rating={detail.averageRating} />
              <span className="text-muted-foreground">
                {detail.reviewCount} review{detail.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {reviewsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load reviews</AlertTitle>
            <AlertDescription>{errorMessage(reviewsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}
        {reviewsQuery.isLoading ? (
          <p className="text-muted-foreground">Loading reviews…</p>
        ) : null}
        {reviewsQuery.isSuccess && reviews.length === 0 ? (
          <p className="text-muted-foreground">
            No reviews yet. Reviews appear after apprentices complete a session.
          </p>
        ) : null}
        <ul className="divide-y">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex gap-3 py-4 first:pt-0"
              data-testid="mentor-review"
            >
              <MentorAvatar
                name={review.reviewerFirstName}
                className="size-9 text-sm"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">{review.reviewerFirstName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(review.createdAt)}
                  </span>
                </div>
                <StarRow rating={review.rating} />
                {review.comment ? (
                  <p className="leading-relaxed">{review.comment}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {reviewsQuery.hasNextPage ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={reviewsQuery.isFetchingNextPage}
            onClick={() => void reviewsQuery.fetchNextPage()}
          >
            {reviewsQuery.isFetchingNextPage ? 'Loading…' : 'See more reviews'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function BookingCard({
  detail,
  profileId,
}: {
  detail: DiscoveryMentorDetail
  profileId: string
}) {
  const navigate = useNavigate()
  const apprenticeQuery = useApprenticeProfile()
  const createBooking = useCreateBooking()

  const [skillId, setSkillId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<BookingDuration>(30)
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
  )

  const resolvedSkillId = skillId || detail.expertise[0]?.skillId || ''
  const rate = formatHourlyRate(detail.hourlyRate, detail.currency)

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
    <Card id="book" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>Book a session</CardTitle>
        <CardDescription>
          {rate ? `${rate} per hour · ` : ''}Slots for the next 14 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apprenticeQuery.data && !apprenticeQuery.isLoading ? (
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <Label>Skill</Label>
            <Select value={resolvedSkillId} onValueChange={setSkillId}>
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
            <p className="text-sm text-muted-foreground">Loading slots…</p>
          ) : null}
          {slotsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Slots failed</AlertTitle>
              <AlertDescription>{errorMessage(slotsQuery.error)}</AlertDescription>
            </Alert>
          ) : null}
          {(slotsQuery.data ?? []).length === 0 && !slotsQuery.isLoading ? (
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
          className="w-full"
          onClick={() => void onBook()}
          disabled={
            createBooking.isPending || !selectedStartAt || !apprenticeQuery.data
          }
        >
          {createBooking.isPending ? 'Requesting…' : 'Request booking'}
        </Button>
      </CardContent>
    </Card>
  )
}
