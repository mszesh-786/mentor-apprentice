import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAddAvailabilityException,
  useMentorAvailability,
  useMentorAvailabilityExceptions,
  useMentorProfile,
  useRemoveAvailabilityException,
  useSetAvailability,
} from '@/api/mentors'
import type { AvailabilityRuleInput, DayOfWeek } from '@/api/types'
import { DAYS_OF_WEEK } from '@/api/types'
import { errorMessage } from '@/lib/errors'

type DraftRule = AvailabilityRuleInput & { key: string }

function newRule(timezone: string): DraftRule {
  return {
    key: crypto.randomUUID(),
    dayOfWeek: 'MONDAY',
    startTime: '10:00',
    endTime: '12:00',
    timezone,
  }
}

function formatExceptionWindow(
  startTime: string | null,
  endTime: string | null,
): string {
  if (!startTime && !endTime) return 'All day'
  if (startTime && endTime) return `${startTime} – ${endTime}`
  return 'Partial block'
}

function defaultExceptionDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function MentorAvailabilityPage() {
  const profileQuery = useMentorProfile()
  const availabilityQuery = useMentorAvailability()
  const exceptionsQuery = useMentorAvailabilityExceptions()
  const setAvailability = useSetAvailability()
  const addException = useAddAvailabilityException()
  const removeException = useRemoveAvailabilityException()
  const timezone = profileQuery.data?.timezone ?? 'Europe/Helsinki'

  const [rules, setRules] = useState<DraftRule[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [exceptionDate, setExceptionDate] = useState(defaultExceptionDate)
  const [wholeDay, setWholeDay] = useState(true)
  const [exceptionStart, setExceptionStart] = useState('10:00')
  const [exceptionEnd, setExceptionEnd] = useState('12:00')
  const [exceptionMessage, setExceptionMessage] = useState<string | null>(null)
  const [exceptionError, setExceptionError] = useState<string | null>(null)

  useEffect(() => {
    if (!availabilityQuery.data) return
    setRules(
      availabilityQuery.data.map((rule) => ({
        key: rule.id,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        timezone: rule.timezone,
      })),
    )
  }, [availabilityQuery.data])

  if (profileQuery.data === null) {
    return (
      <AppShell title="Mentor · Availability">
        <Alert>
          <AlertTitle>Create a profile first</AlertTitle>
          <AlertDescription>
            <Link to="/mentor/profile" className="underline">
              Go to profile
            </Link>
          </AlertDescription>
        </Alert>
      </AppShell>
    )
  }

  function updateRule(key: string, patch: Partial<DraftRule>) {
    setRules((current) =>
      current.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)),
    )
  }

  async function onSave() {
    setMessage(null)
    setError(null)
    try {
      await setAvailability.mutateAsync(
        rules.map(({ dayOfWeek, startTime, endTime, timezone: tz }) => ({
          dayOfWeek,
          startTime,
          endTime,
          timezone: tz,
        })),
      )
      setMessage('Availability saved')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onAddException(event: React.FormEvent) {
    event.preventDefault()
    setExceptionMessage(null)
    setExceptionError(null)
    try {
      await addException.mutateAsync({
        date: exceptionDate,
        startTime: wholeDay ? null : exceptionStart,
        endTime: wholeDay ? null : exceptionEnd,
      })
      setExceptionMessage('Exception added')
      setExceptionDate(defaultExceptionDate())
      setWholeDay(true)
    } catch (err) {
      setExceptionError(errorMessage(err))
    }
  }

  async function onRemoveException(exceptionId: string) {
    setExceptionMessage(null)
    setExceptionError(null)
    try {
      await removeException.mutateAsync(exceptionId)
      setExceptionMessage('Exception removed')
    } catch (err) {
      setExceptionError(errorMessage(err))
    }
  }

  const exceptionsPending =
    addException.isPending || removeException.isPending

  return (
    <AppShell title="Mentor · Availability">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Availability
            </h1>
            <p className="text-muted-foreground">
              Weekly schedule plus one-off unavailability. Exceptions override
              recurring rules for booking slots.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly rules</CardTitle>
            <CardDescription>
              Replace all weekly rules. At least one window is required to
              publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rules yet.</p>
            ) : null}

            {rules.map((rule) => (
              <div
                key={rule.key}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-4"
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label>Day</Label>
                  <Select
                    value={rule.dayOfWeek}
                    onValueChange={(value) =>
                      updateRule(rule.key, {
                        dayOfWeek: value as DayOfWeek,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    value={rule.startTime}
                    onChange={(e) =>
                      updateRule(rule.key, { startTime: e.target.value })
                    }
                    placeholder="10:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    value={rule.endTime}
                    onChange={(e) =>
                      updateRule(rule.key, { endTime: e.target.value })
                    }
                    placeholder="12:00"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRules((current) =>
                        current.filter((item) => item.key !== rule.key),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setRules((current) => [...current, newRule(timezone)])}
            >
              Add rule
            </Button>

            {message ? (
              <Alert>
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-2">
              <Button
                onClick={() => void onSave()}
                disabled={setAvailability.isPending}
              >
                {setAvailability.isPending ? 'Saving…' : 'Save availability'}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/mentor/publish">Next: Publish</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unavailability exceptions</CardTitle>
            <CardDescription>
              Block specific dates or time windows. Already confirmed bookings
              stay valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4 rounded-md border p-3" onSubmit={onAddException}>
              <div className="space-y-2">
                <Label htmlFor="exceptionDate">Date</Label>
                <Input
                  id="exceptionDate"
                  type="date"
                  value={exceptionDate}
                  onChange={(event) => setExceptionDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exceptionScope">Block type</Label>
                <Select
                  value={wholeDay ? 'all-day' : 'time-range'}
                  onValueChange={(value) => setWholeDay(value === 'all-day')}
                >
                  <SelectTrigger id="exceptionScope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-day">Whole day</SelectItem>
                    <SelectItem value="time-range">Time range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!wholeDay ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="exceptionStart">Start</Label>
                    <Input
                      id="exceptionStart"
                      value={exceptionStart}
                      onChange={(event) =>
                        setExceptionStart(event.target.value)
                      }
                      placeholder="10:00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exceptionEnd">End</Label>
                    <Input
                      id="exceptionEnd"
                      value={exceptionEnd}
                      onChange={(event) => setExceptionEnd(event.target.value)}
                      placeholder="12:00"
                      required
                    />
                  </div>
                </div>
              ) : null}
              <Button type="submit" disabled={exceptionsPending}>
                {addException.isPending ? 'Adding…' : 'Add exception'}
              </Button>
            </form>

            {exceptionMessage ? (
              <Alert>
                <AlertTitle>Updated</AlertTitle>
                <AlertDescription>{exceptionMessage}</AlertDescription>
              </Alert>
            ) : null}
            {exceptionError ? (
              <Alert variant="destructive">
                <AlertTitle>Exception failed</AlertTitle>
                <AlertDescription>{exceptionError}</AlertDescription>
              </Alert>
            ) : null}

            {exceptionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading exceptions…</p>
            ) : null}

            {exceptionsQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load exceptions</AlertTitle>
                <AlertDescription>
                  {errorMessage(exceptionsQuery.error)}
                </AlertDescription>
              </Alert>
            ) : null}

            {(exceptionsQuery.data ?? []).length === 0 &&
            !exceptionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                No exceptions yet.
              </p>
            ) : null}

            <div className="space-y-2">
              {(exceptionsQuery.data ?? []).map((exception) => (
                <div
                  key={exception.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{exception.date}</p>
                    <p className="text-muted-foreground">
                      {formatExceptionWindow(
                        exception.startTime,
                        exception.endTime,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{exception.type}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={exceptionsPending}
                      onClick={() => void onRemoveException(exception.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
