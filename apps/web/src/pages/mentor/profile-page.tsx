import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateMentorProfile,
  useMentorProfile,
  useUpdateMentorProfile,
} from '@/api/mentors'
import { errorMessage } from '@/lib/errors'

export function MentorProfilePage() {
  const profileQuery = useMentorProfile()
  const createProfile = useCreateMentorProfile()
  const updateProfile = useUpdateMentorProfile()

  const [headline, setHeadline] = useState('')
  const [biography, setBiography] = useState('')
  const [generalLocation, setGeneralLocation] = useState('')
  const [timezone, setTimezone] = useState('Europe/Helsinki')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const profile = profileQuery.data
    if (!profile) return
    setHeadline(profile.headline ?? '')
    setBiography(profile.biography ?? '')
    setGeneralLocation(profile.generalLocation ?? '')
    setTimezone(profile.timezone ?? 'Europe/Helsinki')
  }, [profileQuery.data])

  const exists = Boolean(profileQuery.data)
  const pending = createProfile.isPending || updateProfile.isPending

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    const body = {
      headline: headline.trim() || undefined,
      biography: biography.trim() || undefined,
      generalLocation: generalLocation.trim() || undefined,
      timezone: timezone.trim() || undefined,
    }
    try {
      if (exists) {
        await updateProfile.mutateAsync(body)
        setMessage('Profile updated')
      } else {
        await createProfile.mutateAsync(body)
        setMessage('Profile created')
      }
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Mentor · Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Create or update your mentor draft profile.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        {profileQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {profileQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load profile</AlertTitle>
            <AlertDescription>
              {errorMessage(profileQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{exists ? 'Edit profile' : 'Create profile'}</CardTitle>
            <CardDescription>
              Headline and timezone help apprentices find the right mentor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Retired mechanic mentoring apprentices"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biography">Biography</Label>
                <textarea
                  id="biography"
                  className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Short background and what you teach"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">General location</Label>
                <Input
                  id="location"
                  value={generalLocation}
                  onChange={(e) => setGeneralLocation(e.target.value)}
                  placeholder="Helsinki"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone (IANA)</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Europe/Helsinki"
                />
              </div>

              {message ? (
                <Alert>
                  <AlertTitle>Saved</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending
                    ? 'Saving…'
                    : exists
                      ? 'Save changes'
                      : 'Create profile'}
                </Button>
                {exists ? (
                  <Button variant="outline" asChild>
                    <Link to="/mentor/languages">Next: Languages</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
