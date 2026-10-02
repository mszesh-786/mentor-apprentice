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
  useApprenticeProfile,
  useCreateApprenticeProfile,
  useUpdateApprenticeProfile,
} from '@/api/apprentices'
import { errorMessage } from '@/lib/errors'

export function ApprenticeProfilePage() {
  const profileQuery = useApprenticeProfile()
  const createProfile = useCreateApprenticeProfile()
  const updateProfile = useUpdateApprenticeProfile()

  const [shortBio, setShortBio] = useState('')
  const [generalLocation, setGeneralLocation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const profile = profileQuery.data
    if (!profile) return
    setShortBio(profile.shortBio ?? '')
    setGeneralLocation(profile.generalLocation ?? '')
  }, [profileQuery.data])

  const exists = Boolean(profileQuery.data)
  const pending = createProfile.isPending || updateProfile.isPending

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    const body = {
      shortBio: shortBio.trim() || undefined,
      generalLocation: generalLocation.trim() || undefined,
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
    <AppShell title="Apprentice · Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Required before booking a mentor.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/apprentice">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{exists ? 'Edit profile' : 'Create profile'}</CardTitle>
            <CardDescription>
              Short bio helps mentors understand your goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="shortBio">Short bio</Label>
                <Input
                  id="shortBio"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="Learning carpentry basics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generalLocation">General location</Label>
                <Input
                  id="generalLocation"
                  value={generalLocation}
                  onChange={(e) => setGeneralLocation(e.target.value)}
                  placeholder="Helsinki"
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

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>
                  {pending
                    ? 'Saving…'
                    : exists
                      ? 'Save changes'
                      : 'Create profile'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/apprentice/discover">Next: Discover</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
