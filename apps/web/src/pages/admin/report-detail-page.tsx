import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useAdminReport, useResolveReport } from '@/api/admin'
import type { UserReportResolutionOutcome } from '@/api/types'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

const outcomes: { value: UserReportResolutionOutcome; label: string }[] = [
  { value: 'NO_ACTION', label: 'No action' },
  { value: 'WARNING', label: 'Warning (note only)' },
  { value: 'USER_SUSPENDED', label: 'Suspend user' },
  { value: 'USER_DEACTIVATED', label: 'Deactivate user' },
  { value: 'DISMISSED', label: 'Dismiss report' },
]

export function AdminReportDetailPage() {
  const { reportId } = useParams({ from: '/admin/reports/$reportId' })
  const detailQuery = useAdminReport(reportId)
  const resolve = useResolveReport()
  const [outcome, setOutcome] =
    useState<UserReportResolutionOutcome>('NO_ACTION')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const report = detailQuery.data
  const closed =
    report?.status === 'RESOLVED' || report?.status === 'DISMISSED'

  async function onResolve() {
    setError(null)
    try {
      await resolve.mutateAsync({
        reportId,
        body: { outcome, note: note.trim() || undefined },
      })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Admin report">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
            <p className="text-muted-foreground">
              {report ? formatWhen(report.createdAt) : '…'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/reports">Back</Link>
          </Button>
        </div>

        {detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load report</AlertTitle>
            <AlertDescription>
              {errorMessage(detailQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {report ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{report.status}</Badge>
              <Badge variant="secondary">{report.reason}</Badge>
              {report.resolutionOutcome ? (
                <Badge>{report.resolutionOutcome}</Badge>
              ) : null}
            </div>
            <p>
              Reported:{' '}
              <Link
                to="/admin/users/$userId"
                params={{ userId: report.reportedUserId }}
                className="underline"
              >
                {report.reportedDisplayName ?? report.reportedUserId}
              </Link>
            </p>
            <p>
              Reporter:{' '}
              <Link
                to="/admin/users/$userId"
                params={{ userId: report.reporterUserId }}
                className="underline"
              >
                {report.reporterDisplayName ?? report.reporterUserId}
              </Link>
            </p>
            <p className="whitespace-pre-wrap">{report.description}</p>
            {report.resolutionNote ? (
              <p className="text-muted-foreground">
                Resolution note: {report.resolutionNote}
              </p>
            ) : null}

            {!closed ? (
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Select
                    value={outcome}
                    onValueChange={(value) =>
                      setOutcome(value as UserReportResolutionOutcome)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {outcomes.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <textarea
                    id="note"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={note}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNote(e.target.value)
                    }
                    rows={3}
                  />
                </div>
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Resolve failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  disabled={resolve.isPending}
                  onClick={() => void onResolve()}
                >
                  {resolve.isPending ? 'Saving…' : 'Resolve report'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
