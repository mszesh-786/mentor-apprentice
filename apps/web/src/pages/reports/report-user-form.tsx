import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmitReport } from '@/api/reports'
import type { UserReportReason } from '@/api/types'
import { errorMessage } from '@/lib/errors'

const reasons: { value: UserReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Inappropriate behavior' },
  { value: 'SAFETY_CONCERN', label: 'Safety concern' },
  { value: 'SPAM', label: 'Spam or scam' },
  { value: 'OTHER', label: 'Other' },
]

export function ReportUserForm({
  reportedUserId,
  sessionId,
  mentorshipId,
  bookingId,
  onSubmitted,
}: {
  reportedUserId: string
  sessionId?: string
  mentorshipId?: string
  bookingId?: string
  onSubmitted?: () => void
}) {
  const submit = useSubmitReport()
  const [reason, setReason] = useState<UserReportReason>('OTHER')
  const [description, setDescription] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (description.trim().length < 20) {
      setError('Please provide at least 20 characters describing the issue.')
      return
    }
    setError(null)
    try {
      await submit.mutateAsync({
        reportedUserId,
        reason,
        description: description.trim(),
        sessionId,
        mentorshipId,
        bookingId,
      })
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (done) {
    return (
      <Alert>
        <AlertTitle>Report submitted</AlertTitle>
        <AlertDescription>
          Thank you. Our team will review this report. The other person will not
          be notified that you reported them.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="reportReason">Reason</Label>
        <Select
          value={reason}
          onValueChange={(value) => setReason(value as UserReportReason)}
        >
          <SelectTrigger id="reportReason">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reportDescription">What happened?</Label>
        <textarea
          id="reportDescription"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what happened so we can review it."
          required
          minLength={20}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 20 characters. Identity verification confirms who someone is,
          not their professional qualifications.
        </p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not submit report</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? 'Submitting…' : 'Submit report'}
      </Button>
    </form>
  )
}
