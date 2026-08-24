import { useEffect, useState } from 'react'
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
  useMentorAvailability,
  useMentorProfile,
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

export function MentorAvailabilityPage() {
  const profileQuery = useMentorProfile()
  const availabilityQuery = useMentorAvailability()
  const setAvailability = useSetAvailability()
  const timezone = profileQuery.data?.timezone ?? 'Europe/Helsinki'

  const [rules, setRules] = useState<DraftRule[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <AppShell title="Mentor · Availability">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Weekly availability
            </h1>
            <p className="text-muted-foreground">
              Replace all weekly rules. At least one window is required to
              publish.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
            <CardDescription>
              Times are local to each rule timezone (defaults to profile
              timezone).
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
      </div>
    </AppShell>
  )
}
