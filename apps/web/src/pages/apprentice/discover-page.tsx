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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguages, useSkills } from '@/api/catalog'
import { useDiscoverMentors } from '@/api/discovery'
import type { DiscoverySearchParams, TeachingLevel } from '@/api/types'
import { TEACHING_LEVELS } from '@/api/types'
import { errorMessage } from '@/lib/errors'

export function ApprenticeDiscoverPage() {
  const skillsQuery = useSkills()
  const languagesQuery = useLanguages()

  const [skillId, setSkillId] = useState('')
  const [languageId, setLanguageId] = useState<string>('')
  const [teachingLevel, setTeachingLevel] = useState<string>('')
  const [search, setSearch] = useState<DiscoverySearchParams | null>(null)

  const resultsQuery = useDiscoverMentors(search)

  function onSearch(event: React.FormEvent) {
    event.preventDefault()
    if (!skillId) return
    setSearch({
      skillId,
      languageId: languageId || undefined,
      teachingLevel: (teachingLevel as TeachingLevel) || undefined,
    })
  }

  return (
    <AppShell title="Apprentice · Discover">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Discover mentors
            </h1>
            <p className="text-muted-foreground">
              Search published, verified mentors by skill.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/apprentice">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Skill is required. Filters are optional.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-3" onSubmit={onSearch}>
              <div className="space-y-2">
                <Label>Skill</Label>
                <Select value={skillId} onValueChange={setSkillId}>
                  <SelectTrigger data-testid="discover-skill-select">
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {(skillsQuery.data ?? []).map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language (optional)</Label>
                <Select
                  value={languageId || '__any__'}
                  onValueChange={(value) =>
                    setLanguageId(value === '__any__' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any</SelectItem>
                    {(languagesQuery.data ?? []).map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teaching level (optional)</Label>
                <Select
                  value={teachingLevel || '__any__'}
                  onValueChange={(value) =>
                    setTeachingLevel(value === '__any__' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any</SelectItem>
                    {TEACHING_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={!skillId}>
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {resultsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Search failed</AlertTitle>
            <AlertDescription>
              {errorMessage(resultsQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {search && resultsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : null}

        {resultsQuery.data ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {resultsQuery.data.length} mentor
              {resultsQuery.data.length === 1 ? '' : 's'} found
            </p>
            {resultsQuery.data.length === 0 ? (
              <Alert>
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Try another skill, language, or teaching level.
                </AlertDescription>
              </Alert>
            ) : null}
            {resultsQuery.data.map((mentor) => (
              <Card key={mentor.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {mentor.displayName}
                      </CardTitle>
                      <CardDescription>
                        {mentor.headline ?? 'No headline'}
                      </CardDescription>
                    </div>
                    <Button size="sm" asChild>
                      <Link
                        to="/apprentice/discover/$profileId"
                        params={{ profileId: mentor.id }}
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{mentor.expertise.skillName}</Badge>
                    <Badge variant="outline">
                      {mentor.expertise.teachingLevel}
                    </Badge>
                    {mentor.hasAvailability ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : null}
                    {mentor.generalLocation ? (
                      <Badge variant="outline">{mentor.generalLocation}</Badge>
                    ) : null}
                  </div>
                  <ul className="list-inside list-disc text-muted-foreground">
                    {mentor.matchReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
