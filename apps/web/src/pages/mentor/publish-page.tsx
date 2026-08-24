import { useState } from 'react'
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
import {
  useMentorProfile,
  usePublishMentor,
  useUnpublishMentor,
} from '@/api/mentors'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/lib/errors'

export function MentorPublishPage() {
  const profileQuery = useMentorProfile()
  const publish = usePublishMentor()
  const unpublish = useUnpublishMentor()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (profileQuery.data === null) {
    return (
      <AppShell title="Mentor · Publish">
        <Alert>
          <AlertTitle>Create a profile first</AlertTitle>
          <AlertDescription>
            <Link to="/mentor/profile" className="underline">
              Go to profile
            </Link>
          </AlertDescription>
        </Alert>
      </AppShell>
    )
  }

  const profile = profileQuery.data
  const eligibility = profile?.publicationEligibility

  async function onPublish() {
    setMessage(null)
    setError(null)
    try {
      await publish.mutateAsync()
      setMessage('Profile published')
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { requirements?: Array<{ label: string; satisfied: boolean }> }
        const missing = body.requirements
          ?.filter((item) => !item.satisfied)
          .map((item) => item.label)
          .join(', ')
        setError(missing ? `Not eligible: ${missing}` : errorMessage(err))
        return
      }
      setError(errorMessage(err))
    }
  }

  async function onUnpublish() {
    setMessage(null)
    setError(null)
    try {
      await unpublish.mutateAsync()
      setMessage('Profile unpublished')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Mentor · Publish">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Publication
            </h1>
            <p className="text-muted-foreground">
              Review eligibility, then publish when ready.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Current publication and bookability</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>{profile?.publicationStatus ?? '—'}</Badge>
            <Badge variant={profile?.isBookable ? 'default' : 'outline'}>
              {profile?.isBookable ? 'Bookable' : 'Not bookable'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(eligibility?.requirements ?? []).map((req) => (
              <div
                key={req.code}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{req.label}</span>
                <Badge variant={req.satisfied ? 'default' : 'outline'}>
                  {req.satisfied ? 'Done' : 'Missing'}
                </Badge>
              </div>
            ))}
            {!eligibility ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : null}
          </CardContent>
        </Card>

        {message ? (
          <Alert>
            <AlertTitle>Updated</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void onPublish()}
            disabled={
              publish.isPending || profile?.publicationStatus === 'PUBLISHED'
            }
          >
            {publish.isPending ? 'Publishing…' : 'Publish'}
          </Button>
          <Button
            variant="outline"
            onClick={() => void onUnpublish()}
            disabled={
              unpublish.isPending || profile?.publicationStatus !== 'PUBLISHED'
            }
          >
            {unpublish.isPending ? 'Unpublishing…' : 'Unpublish'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
