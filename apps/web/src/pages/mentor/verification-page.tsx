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
  useIdentityVerification,
  useStartIdentityVerification,
  useStubVerificationResult,
} from '@/api/verification'
import { errorMessage } from '@/lib/errors'

export function MentorVerificationPage() {
  const verificationQuery = useIdentityVerification()
  const start = useStartIdentityVerification()
  const stub = useStubVerificationResult()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = verificationQuery.data?.status ?? 'NOT_STARTED'

  async function onStart() {
    setMessage(null)
    setError(null)
    try {
      await start.mutateAsync()
      setMessage('Identity verification started (PENDING)')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onStub(result: 'VERIFIED' | 'FAILED' | 'REQUIRES_REVIEW') {
    setMessage(null)
    setError(null)
    try {
      await stub.mutateAsync(result)
      setMessage(`Stub result applied: ${result}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Mentor · Verification">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Identity verification
            </h1>
            <p className="text-muted-foreground">
              VERIFIED identity is required before publishing. Stub provider for
              Validation A.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>User-owned identity verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <Badge variant={status === 'VERIFIED' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void onStart()}
                disabled={start.isPending || status === 'VERIFIED'}
              >
                {start.isPending ? 'Starting…' : 'Start verification'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void onStub('VERIFIED')}
                disabled={stub.isPending}
              >
                Stub: VERIFIED
              </Button>
              <Button
                variant="outline"
                onClick={() => void onStub('FAILED')}
                disabled={stub.isPending}
              >
                Stub: FAILED
              </Button>
            </div>

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

            <Button variant="outline" asChild>
              <Link to="/mentor/availability">Next: Availability</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
