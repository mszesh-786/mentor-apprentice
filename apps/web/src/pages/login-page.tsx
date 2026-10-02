import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/auth/auth-context'
import { isAuth0WebMode } from '@/auth/auth-mode'
import { homePathForSession } from '@/auth/session'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LoginPage() {
  const { login, loginWithAuth0, isLoading } = useAuth()
  const navigate = useNavigate()
  const auth0Mode = isAuth0WebMode()
  const [persona, setPersona] = useState<
    'mentor' | 'apprentice' | 'dual' | 'admin'
  >('mentor')
  const [displayName, setDisplayName] = useState('David')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onStubSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login({ persona, displayName: displayName.trim() || 'User' })
      await navigate({
        to:
          persona === 'admin'
            ? '/admin'
            : persona === 'apprentice'
              ? '/apprentice'
              : '/mentor',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setPending(false)
    }
  }

  async function onAuth0Click() {
    setError(null)
    setPending(true)
    try {
      await loginWithAuth0()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth0 login failed')
      setPending(false)
    }
  }

  if (auth0Mode) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Continue with Auth0. After first login you will choose Mentor,
              Apprentice, or both.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not sign in</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              className="w-full"
              disabled={pending || isLoading}
              onClick={() => void onAuth0Click()}
            >
              {pending || isLoading ? 'Redirecting…' : 'Continue with Auth0'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/register" className="underline hover:text-foreground">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Stub login mints a local HS256 JWT. Prefer{' '}
            <Link to="/register" className="underline hover:text-foreground">
              Create account
            </Link>{' '}
            for email + role. Use <code>VITE_AUTH_MODE=auth0</code> for Auth0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onStubSubmit}>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="David"
              />
            </div>
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select
                value={persona}
                onValueChange={(value) =>
                  setPersona(
                    value as 'mentor' | 'apprentice' | 'dual' | 'admin',
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                  <SelectItem value="dual">Dual role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not sign in</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Signing in…' : 'Continue'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/register" className="underline hover:text-foreground">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthCallbackPage() {
  const { session, isLoading, refreshSessionFromApi } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth0WebMode()) {
      void navigate({ to: '/login' })
      return
    }
    if (isLoading) return

    void (async () => {
      try {
        const next = session ?? (await refreshSessionFromApi())
        if (!next) {
          await navigate({ to: '/login' })
          return
        }
        if (next.needsRoleSelection || next.roles.length === 0) {
          await navigate({ to: '/onboarding/role' })
          return
        }
        await navigate({
          to: homePathForSession(next),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth callback failed')
      }
    })()
  }, [isLoading, navigate, refreshSessionFromApi, session])

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Completing sign-in</CardTitle>
          <CardDescription>Finishing Auth0 redirect…</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">Please wait…</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
