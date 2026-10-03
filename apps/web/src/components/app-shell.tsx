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
import { cn } from '@/lib/utils'

function roleLabel(role: AppRole): string {
  if (role === 'MENTOR') return 'Mentor'
  if (role === 'APPRENTICE') return 'Apprentice'
  return 'Admin'
}

type NavItem = { to: string; label: string; exact?: boolean }

const NAV_ITEMS: Record<AppRole, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'Home', exact: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  MENTOR: [
    { to: '/mentor', label: 'Home', exact: true },
    { to: '/mentor/profile', label: 'Profile' },
    { to: '/mentor/languages', label: 'Languages' },
    { to: '/mentor/expertise', label: 'Expertise' },
    { to: '/mentor/verification', label: 'Verification' },
    { to: '/mentor/availability', label: 'Availability' },
    { to: '/mentor/publish', label: 'Publish' },
    { to: '/mentor/bookings', label: 'Bookings' },
    { to: '/mentor/sessions', label: 'Sessions' },
    { to: '/mentor/mentorships', label: 'Mentorships' },
  ],
  APPRENTICE: [
    { to: '/apprentice', label: 'Home', exact: true },
    { to: '/apprentice/profile', label: 'Profile' },
    { to: '/apprentice/discover', label: 'Discover' },
    { to: '/apprentice/bookings', label: 'Bookings' },
    { to: '/apprentice/sessions', label: 'Sessions' },
    { to: '/apprentice/mentorships', label: 'Mentorships' },
  ],
}

export function AppShell({
  title,
  fullWidth = false,
  children,
}: {
  title: string
  /** Let content span the viewport (dashboards) instead of the reading-width column. */
  fullWidth?: boolean
  children: ReactNode
}) {
  const { session, logout, setActiveRole } = useAuth()
  const navigate = useNavigate()
  const unreadQuery = useUnreadNotificationCount()
  const unreadCount = unreadQuery.data?.count ?? 0
  if (!session) return null

  const isAdmin = session.activeRole === 'ADMIN'
  const container = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6 lg:px-8'
    : 'mx-auto max-w-5xl px-4'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div
          className={cn(container, 'flex items-center justify-between gap-4 py-3')}
        >
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
        <nav
          aria-label="Main"
          className={cn(container, '-mb-px flex gap-1 overflow-x-auto text-sm')}
        >
          {NAV_ITEMS[session.activeRole].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="whitespace-nowrap border-b-2 px-2 pb-2.5 pt-1 transition-colors"
              inactiveProps={{
                className:
                  'border-transparent text-muted-foreground hover:text-foreground',
              }}
              activeProps={{
                className: 'border-foreground font-medium text-foreground',
                'aria-current': 'page',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className={cn(container, fullWidth ? 'py-6' : 'py-8')}>
        {children}
      </main>
    </div>
  )
}
