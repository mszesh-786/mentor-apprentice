import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthPing } from '@/api/health'
import { useAuth } from '@/auth/auth-context'
import { ApiError } from '@/api/client'

export function MentorHomePage() {
  const { session } = useAuth()
  const ping = useAuthPing(Boolean(session))

  return (
    <AppShell title="Mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mentor home</h1>
          <p className="text-muted-foreground">
            F1 foundation. Profile, availability, and publish land in F2.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Stub JWT identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{session?.email}</Badge>
              <Badge>{session?.activeRole}</Badge>
            </div>
            <p className="text-muted-foreground break-all">sub: {session?.sub}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API check</CardTitle>
            <CardDescription>Authenticated GET /languages</CardDescription>
          </CardHeader>
          <CardContent>
            {ping.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking…</p>
            ) : null}
            {ping.isSuccess ? (
              <Alert>
                <AlertTitle>Connected</AlertTitle>
                <AlertDescription>
                  API reachable at {ping.data.path}
                </AlertDescription>
              </Alert>
            ) : null}
            {ping.isError ? (
              <Alert variant="destructive">
                <AlertTitle>API unreachable</AlertTitle>
                <AlertDescription>
                  {ping.error instanceof ApiError
                    ? ping.error.message
                    : 'Start the API (`npm run dev:api`) and confirm VITE_API_URL / JWT secret.'}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
