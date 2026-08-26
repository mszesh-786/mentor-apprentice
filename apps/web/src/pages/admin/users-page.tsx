import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useAdminUsers,
  useSuspendUser,
  useUnsuspendUser,
} from '@/api/admin'
import type { UserStatus } from '@/api/types'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { errorMessage } from '@/lib/errors'

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL')
  const listQuery = useAdminUsers({
    q: q.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
  })
  const suspend = useSuspendUser()
  const unsuspend = useUnsuspendUser()

  return (
    <AppShell title="Admin users">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Search by email or name. Suspend blocks bookings and publish.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">Back</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search email or name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as UserStatus | 'ALL')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load users</AlertTitle>
            <AlertDescription>{errorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {(listQuery.data ?? []).map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: user.id }}
                  className="font-medium hover:underline"
                >
                  {user.displayName ?? user.email}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{user.status}</Badge>
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {user.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={suspend.isPending}
                    onClick={() => void suspend.mutateAsync(user.id)}
                  >
                    Suspend
                  </Button>
                ) : null}
                {user.status === 'SUSPENDED' ? (
                  <Button
                    size="sm"
                    disabled={unsuspend.isPending}
                    onClick={() => void unsuspend.mutateAsync(user.id)}
                  >
                    Unsuspend
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
