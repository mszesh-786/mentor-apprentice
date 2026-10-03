import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { AppNotification, Booking } from '@/api/types'
import { formatTimeAgo, formatWhen } from '@/lib/datetime'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DashboardHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  highlight = false,
}: {
  label: string
  value: number | string
  hint: string
  icon: LucideIcon
  to: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={cn(
          'h-full transition-colors group-hover:bg-accent/50',
          highlight && 'border-foreground/30',
        )}
      >
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-md border bg-muted p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DashboardSection({
  title,
  description,
  viewAll,
  children,
  className,
}: {
  title: string
  description?: string
  viewAll?: { to: string; label?: string }
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {viewAll ? (
          <Button variant="ghost" size="sm" asChild className="-mr-2 -mt-1">
            <Link to={viewAll.to}>
              {viewAll.label ?? 'View all'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyState({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      <p>{children}</p>
      {action}
    </div>
  )
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

const BOOKING_STATUS_LABEL: Record<Booking['status'], string> = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
}

export function BookingRow({
  booking,
  counterpartName,
  to,
  actionLabel,
}: {
  booking: Booking
  counterpartName: string | null
  to: string
  actionLabel: string
}) {
  const name = counterpartName ?? 'Unknown'
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {booking.skillName} · {formatWhen(booking.startAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant={booking.status === 'REQUESTED' ? 'outline' : 'secondary'}
          className="hidden sm:inline-flex"
        >
          {BOOKING_STATUS_LABEL[booking.status]}
        </Badge>
        <Button variant="outline" size="sm" asChild>
          <Link to={to}>{actionLabel}</Link>
        </Button>
      </div>
    </li>
  )
}

export function NotificationList({
  notifications,
}: {
  notifications: AppNotification[]
}) {
  return (
    <ul className="space-y-1">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <Link
            to="/notifications"
            className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
          >
            <span
              aria-hidden
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                notification.readAt ? 'bg-transparent' : 'bg-primary',
              )}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {notification.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {formatTimeAgo(notification.createdAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}