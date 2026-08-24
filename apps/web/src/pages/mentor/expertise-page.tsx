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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSkills } from '@/api/catalog'
import {
  useAddExpertise,
  useMentorProfile,
  useRemoveExpertise,
} from '@/api/mentors'
import type { TeachingLevel } from '@/api/types'
import { TEACHING_LEVELS } from '@/api/types'
import { errorMessage } from '@/lib/errors'

export function MentorExpertisePage() {
  const profileQuery = useMentorProfile()
  const skillsQuery = useSkills()
  const addExpertise = useAddExpertise()
  const removeExpertise = useRemoveExpertise()

  const [skillId, setSkillId] = useState('')
  const [years, setYears] = useState('5')
  const [teachingLevel, setTeachingLevel] =
    useState<TeachingLevel>('BEGINNER')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (profileQuery.data === null) {
    return (
      <AppShell title="Mentor · Expertise">
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

  const existingSkillIds = new Set(
    (profileQuery.data?.expertise ?? []).map((item) => item.skillId),
  )
  const availableSkills = (skillsQuery.data ?? []).filter(
    (skill) => !existingSkillIds.has(skill.id),
  )

  async function onAdd(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    if (!skillId) {
      setError('Select a skill')
      return
    }
    try {
      await addExpertise.mutateAsync({
        skillId,
        yearsExperience: Number(years),
        teachingLevel,
        description: description.trim() || undefined,
      })
      setMessage('Expertise added')
      setSkillId('')
      setDescription('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function onRemove(id: string) {
    setMessage(null)
    setError(null)
    try {
      await removeExpertise.mutateAsync(id)
      setMessage('Expertise removed')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell title="Mentor · Expertise">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Expertise</h1>
            <p className="text-muted-foreground">
              Add skills you can teach. Active expertise is required to publish.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentor">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current expertise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(profileQuery.data?.expertise ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              profileQuery.data?.expertise.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.skill.name}</span>
                      <Badge variant="secondary">{item.teachingLevel}</Badge>
                      <Badge variant="outline">
                        {item.yearsExperience} yrs
                      </Badge>
                    </div>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void onRemove(item.id)}
                    disabled={removeExpertise.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add skill</CardTitle>
            <CardDescription>Pick from the active skills catalogue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onAdd}>
              <div className="space-y-2">
                <Label>Skill</Label>
                <Select value={skillId} onValueChange={setSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="years">Years experience</Label>
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    max={80}
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teaching level</Label>
                  <Select
                    value={teachingLevel}
                    onValueChange={(value) =>
                      setTeachingLevel(value as TeachingLevel)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEACHING_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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

              <div className="flex gap-2">
                <Button type="submit" disabled={addExpertise.isPending}>
                  {addExpertise.isPending ? 'Adding…' : 'Add expertise'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/mentor/verification">Next: Verification</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
