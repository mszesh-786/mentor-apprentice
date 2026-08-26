import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/auth/auth-context'
import type { AppRole } from '@/auth/session'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function RoleOnboardingPage() {
  const { session, completeRoleSelection, logout } = useAuth()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<'mentor' | 'apprentice' | 'dual'>(
    'mentor',
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const roles: AppRole[] =
        selection === 'mentor'
          ? ['MENTOR']
          : selection === 'apprentice'
            ? ['APPRENTICE']
            : ['MENTOR', 'APPRENTICE']
      const next = await completeRoleSelection(roles)
      await navigate({
        to: next.activeRole === 'MENTOR' ? '/mentor' : '/apprentice',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save roles')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Choose your role</CardTitle>
          <CardDescription>
            Signed in as {session?.email ?? 'you'}. Pick how you will use Mentor
            Apprentice. You can hold both roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>I want to join as</Label>
              <div className="grid gap-2">
                {(
                  [
                    ['mentor', 'Mentor'],
                    ['apprentice', 'Apprentice'],
                    ['dual', 'Both mentor and apprentice'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={selection === value ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setSelection(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            {session && session.emailVerified === false ? (
              <Alert>
                <AlertTitle>Verify your email</AlertTitle>
                <AlertDescription>
                  You can set a role now, but publishing and booking require a
                  verified email address.
                </AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not continue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? 'Saving…' : 'Continue'}
              </Button>
              <Button type="button" variant="outline" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
