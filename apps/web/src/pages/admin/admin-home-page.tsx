import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminHomePage() {
  return (
    <AppShell title="Admin">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">
            Review users and safety reports. Suspend accounts when needed.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Search, inspect, suspend</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/users">Open users</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Review and resolve open cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/reports">Open reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
