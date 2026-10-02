import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAdminReports } from '@/api/admin'
import type { UserReportStatus } from '@/api/types'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatWhen } from '@/lib/datetime'
import { errorMessage } from '@/lib/errors'

export function AdminReportsPage() {
  const [status, setStatus] = useState<UserReportStatus | 'ALL'>('OPEN')
  const listQuery = useAdminReports(
    status === 'ALL' ? undefined : status,
  )

  return (
    <AppShell title="Admin reports">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Open reports need a resolution outcome.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">Back</Link>
          </Button>
        </div>

        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as UserReportStatus | 'ALL')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load reports</AlertTitle>
            <AlertDescription>{errorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((report) => (
            <Link
              key={report.id}
              to="/admin/reports/$reportId"
              params={{ reportId: report.id }}
              className="block space-y-1 border-b py-3 hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {report.reportedDisplayName ?? 'Reported user'}
                </span>
                <Badge variant="outline">{report.status}</Badge>
                <Badge variant="secondary">{report.reason}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                by {report.reporterDisplayName ?? 'Reporter'} ·{' '}
                {formatWhen(report.createdAt)}
              </p>
              <p className="line-clamp-2 text-sm">{report.description}</p>
            </Link>
          ))}
          {(listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
            <Alert>
              <AlertTitle>No reports</AlertTitle>
              <AlertDescription>
                Nothing matches this filter.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
