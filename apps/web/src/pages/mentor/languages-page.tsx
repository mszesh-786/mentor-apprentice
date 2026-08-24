import { useEffect, useState } from 'react'
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
import { useLanguages } from '@/api/catalog'
import { useMentorProfile, useSetMentorLanguages } from '@/api/mentors'
import { errorMessage } from '@/lib/errors'

export function MentorLanguagesPage() {
  const profileQuery = useMentorProfile()
  const languagesQuery = useLanguages()
  const setLanguages = useSetMentorLanguages()
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileQuery.data) return
    setSelected(profileQuery.data.languages.map((lang) => lang.id))
  }, [profileQuery.data])

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  async function onSave() {
    setMessage(null)
    setError(null)
    try {
      await setLanguages.mutateAsync(selected)
      setMessage('Languages updated')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (profileQuery.data === null) {
    return (
      <AppShell title="Mentor · Languages">
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

  return (
    <AppShell title="Mentor · Languages">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Languages</h1>
            <p className="text-muted-foreground">
              Select languages you can mentor in.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teaching languages</CardTitle>
            <CardDescription>
              Replace all languages with your current selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {languagesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading catalogue…</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(languagesQuery.data ?? []).map((language) => {
                const active = selected.includes(language.id)
                return (
                  <button
                    key={language.id}
                    type="button"
                    onClick={() => toggle(language.id)}
                    className="focus-visible:outline-none"
                  >
                    <Badge variant={active ? 'default' : 'outline'}>
                      {language.name}
                    </Badge>
                  </button>
                )
              })}
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
              <Button
                onClick={() => void onSave()}
                disabled={setLanguages.isPending}
              >
                {setLanguages.isPending ? 'Saving…' : 'Save languages'}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/mentor/expertise">Next: Expertise</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
