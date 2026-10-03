import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Ban,
  Bell,
  ChevronDown,
  CircleUser,
  Flag,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/auth/auth-context'
import { useUnreadNotificationCount } from '@/api/notifications'
import type { AppRole } from '@/auth/session'
import { homePathForSession } from '@/auth/session'

function roleLabel(role: AppRole): string {
  if (role === 'MENTOR') return 'Mentor'
  if (role === 'APPRENTICE') return 'Apprentice'
  return 'Admin'
}

export function AppShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { session, logout, setActiveRole } = useAuth()
  const navigate = useNavigate()
  const unreadQuery = useUnreadNotificationCount()
  const unreadCount = unreadQuery.data?.count ?? 0
  if (!session) return null

  const isAdmin = session.activeRole === 'ADMIN'

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold tracking-tight">
              Mentor Apprentice
            </Link>
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {session.roles.length > 1 ? (
              <Select
                value={session.activeRole}
                onValueChange={(value) => {
                  const role = value as AppRole
                  setActiveRole(role)
                  void navigate({
                    to: homePathForSession({ ...session, activeRole: role }),
                  })
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {session.roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{roleLabel(session.activeRole)}</Badge>
            )}
            {!isAdmin ? (
              <Button variant="ghost" size="sm" className="relative" asChild>
                <Link
                  to="/notifications"
                  aria-label={
                    unreadCount > 0
                      ? `Notifications (${unreadCount} unread)`
                      : 'Notifications'
                  }
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <Badge
                      variant="default"
                      className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  ) : null}
                </Link>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Account menu">
                  <CircleUser className="h-4 w-4" />
                  <span className="max-w-[10rem] truncate">
                    {session.displayName}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="truncate">{session.displayName}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {roleLabel(session.activeRole)}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAdmin ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/feedback">
                        <MessageSquare />
                        Help us improve
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/blocks">
                        <Ban />
                        Blocked users
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/reports">
                        <Flag />
                        My reports
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem
                  onSelect={() => {
                    logout()
                    void navigate({ to: '/login' })
                  }}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-3 px-4 pb-3 text-sm">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/admin/users"
                className="text-muted-foreground hover:text-foreground"
              >
                Users
              </Link>
              <Link
                to="/admin/reports"
                className="text-muted-foreground hover:text-foreground"
              >
                Reports
              </Link>
            </>
          ) : session.activeRole === 'MENTOR' ? (
            <>
              <Link
                to="/mentor"
                className="text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/mentor/profile"
                className="text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
              <Link
                to="/mentor/languages"
                className="text-muted-foreground hover:text-foreground"
              >
                Languages
              </Link>
              <Link
                to="/mentor/expertise"
                className="text-muted-foreground hover:text-foreground"
              >
                Expertise
              </Link>
              <Link
                to="/mentor/verification"
                className="text-muted-foreground hover:text-foreground"
              >
                Verification
              </Link>
              <Link
                to="/mentor/availability"
                className="text-muted-foreground hover:text-foreground"
              >
                Availability
              </Link>
              <Link
                to="/mentor/publish"
                className="text-muted-foreground hover:text-foreground"
              >
                Publish
              </Link>
              <Link
                to="/mentor/bookings"
                className="text-muted-foreground hover:text-foreground"
              >
                Bookings
              </Link>
              <Link
                to="/mentor/sessions"
                className="text-muted-foreground hover:text-foreground"
              >
                Sessions
              </Link>
              <Link
                to="/mentor/mentorships"
                className="text-muted-foreground hover:text-foreground"
              >
                Mentorships
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/apprentice"
                className="text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/apprentice/profile"
                className="text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
              <Link
                to="/apprentice/discover"
                className="text-muted-foreground hover:text-foreground"
              >
                Discover
              </Link>
              <Link
                to="/apprentice/bookings"
                className="text-muted-foreground hover:text-foreground"
              >
                Bookings
              </Link>
              <Link
                to="/apprentice/sessions"
                className="text-muted-foreground hover:text-foreground"
              >
                Sessions
              </Link>
              <Link
                to="/apprentice/mentorships"
                className="text-muted-foreground hover:text-foreground"
              >
                Mentorships
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
