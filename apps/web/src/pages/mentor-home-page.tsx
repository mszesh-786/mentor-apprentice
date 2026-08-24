import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMentorProfile } from '@/api/mentors'
import { useAuth } from '@/auth/auth-context'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/lib/errors'

const steps = [
  {
    to: '/mentor/profile',
    label: 'Profile',
    codes: ['PROFILE_NAME', 'BIOGRAPHY'] as const,
  },
  {
    to: '/mentor/languages',
    label: 'Languages',
    codes: ['LANGUAGE'] as const,
  },
  {
    to: '/mentor/expertise',
    label: 'Expertise',
    codes: ['EXPERTISE'] as const,
  },
  {
    to: '/mentor/verification',
    label: 'Verification',
    codes: ['IDENTITY_VERIFIED'] as const,
  },
  {
    to: '/mentor/availability',
    label: 'Availability',
    codes: ['AVAILABILITY'] as const,
  },
  {
    to: '/mentor/publish',
    label: 'Publish',
    codes: [] as const,
  },
] as const

export function MentorHomePage() {
  const { session } = useAuth()
  const profileQuery = useMentorProfile()
  const profile = profileQuery.data

  return (
    <AppShell title="Mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mentor home</h1>
          <p className="text-muted-foreground">
            Complete readiness steps to become bookable.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Stub JWT identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">{session?.email}</Badge>
            <Badge>{session?.activeRole}</Badge>
            {profile ? (
              <>
                <Badge variant="secondary">{profile.publicationStatus}</Badge>
                <Badge variant={profile.isBookable ? 'default' : 'outline'}>
                  {profile.isBookable ? 'Bookable' : 'Not bookable'}
                </Badge>
              </>
            ) : (
              <Badge variant="outline">No profile yet</Badge>
            )}
          </CardContent>
        </Card>

        {profileQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load mentor profile</AlertTitle>
            <AlertDescription>
              {profileQuery.error instanceof ApiError
                ? profileQuery.error.message
                : errorMessage(profileQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Readiness</CardTitle>
            <CardDescription>
              Work through each step. Publish when the checklist is green.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => {
              const reqs = profile?.publicationEligibility.requirements ?? []
              const codesSatisfied =
                step.codes.length > 0 &&
                step.codes.every(
                  (code) =>
                    reqs.find((item) => item.code === code)?.satisfied === true,
                )
              const publishDone =
                step.label === 'Publish' &&
                profile?.publicationStatus === 'PUBLISHED'
              const done = publishDone || codesSatisfied

              return (
                <div
                  key={step.to}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={done ? 'default' : 'outline'}>
                      {done ? 'Done' : 'Todo'}
                    </Badge>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={step.to}>Open</Link>
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {profile?.publicationEligibility ? (
          <Card>
            <CardHeader>
              <CardTitle>Server checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.publicationEligibility.requirements.map((req) => (
                <div
                  key={req.code}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{req.label}</span>
                  <Badge variant={req.satisfied ? 'default' : 'outline'}>
                    {req.satisfied ? 'Satisfied' : 'Missing'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  )
}
