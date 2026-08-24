import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/auth/auth-context'
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
  const { login } = useAuth()
  const navigate = useNavigate()
  const [persona, setPersona] = useState<'mentor' | 'apprentice' | 'dual'>(
    'mentor',
  )
  const [displayName, setDisplayName] = useState('David')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login({ persona, displayName: displayName.trim() || 'User' })
      await navigate({
        to: persona === 'apprentice' ? '/apprentice' : '/mentor',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stub login</CardTitle>
          <CardDescription>
            Mints a local HS256 JWT matching the API secret. Validation A only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
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
                  setPersona(value as 'mentor' | 'apprentice' | 'dual')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                  <SelectItem value="dual">Dual role</SelectItem>
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
