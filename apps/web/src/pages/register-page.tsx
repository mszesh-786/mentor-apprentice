import { useState } from 'react'
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

export function RegisterPage() {
  const { register, signupWithAuth0, isLoading } = useAuth()
  const navigate = useNavigate()
  const auth0Mode = isAuth0WebMode()
  const [persona, setPersona] = useState<'mentor' | 'apprentice' | 'dual'>(
    'mentor',
  )
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onStubSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const session = await register({
        email: email.trim(),
        displayName: displayName.trim(),
        persona,
      })
      await navigate({ to: homePathForSession(session) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setPending(false)
    }
  }

  async function onAuth0Click() {
    setError(null)
    setPending(true)
    try {
      await signupWithAuth0()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth0 signup failed')
      setPending(false)
    }
  }

  if (auth0Mode) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Sign up with Auth0. After signup you choose Mentor, Apprentice, or
              both.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not create account</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              className="w-full"
              disabled={pending || isLoading}
              onClick={() => void onAuth0Click()}
            >
              {pending || isLoading ? 'Redirecting…' : 'Sign up with Auth0'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline hover:text-foreground">
                Sign in
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
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Stub registration creates a local user (JWT + API). Same email signs
            you back into the same account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onStubSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label>I want to join as</Label>
              <Select
                value={persona}
                onValueChange={(value) =>
                  setPersona(value as 'mentor' | 'apprentice' | 'dual')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                  <SelectItem value="dual">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not create account</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline hover:text-foreground">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
