import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmitProductFeedback } from '@/api/feedback'
import type { ProductFeedbackCategory } from '@/api/types'
import { useAuth } from '@/auth/auth-context'
import { errorMessage } from '@/lib/errors'

const categories: { value: ProductFeedbackCategory; label: string }[] = [
  { value: 'CONFUSING', label: 'Something was confusing' },
  { value: 'MISSING', label: 'Expected feature missing' },
  { value: 'DIFFICULT', label: 'Something was difficult' },
  { value: 'GENERAL', label: 'General feedback' },
]

export function ProductFeedbackPage() {
  const { session } = useAuth()
  const routerState = useRouterState()
  const submit = useSubmitProductFeedback()
  const home = session?.activeRole === 'MENTOR' ? '/mentor' : '/apprentice'

  const [category, setCategory] =
    useState<ProductFeedbackCategory>('GENERAL')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    setError(null)
    try {
      await submit.mutateAsync({
        category,
        message: message.trim(),
        pageContext: routerState.location.pathname,
      })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Product feedback">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Help us improve
            </h1>
            <p className="text-muted-foreground">
              Tell us about the platform itself — not your mentor or apprentice.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={home}>Back</Link>
          </Button>
        </div>

        {done ? (
          <Alert>
            <AlertTitle>Thanks</AlertTitle>
            <AlertDescription>
              Your feedback helps us validate the product.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Share feedback</CardTitle>
              <CardDescription>
                What was confusing, missing, or hard to use?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(value as ProductFeedbackCategory)
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Input
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What would make this easier?"
                    required
                  />
                </div>
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Could not send feedback</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Button type="submit" disabled={submit.isPending}>
                  {submit.isPending ? 'Sending…' : 'Send feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
