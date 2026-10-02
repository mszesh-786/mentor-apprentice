import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { MentorAvatar } from '@/components/mentor-avatar'
import { RatingSummary } from '@/components/star-rating'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguages, useSkillCategories, useSkills } from '@/api/catalog'
import { useDiscoverMentors } from '@/api/discovery'
import type {
  DiscoveryMentorCard,
  DiscoverySearchParams,
  TeachingLevel,
} from '@/api/types'
import { TEACHING_LEVELS } from '@/api/types'
import { errorMessage } from '@/lib/errors'
import { formatHourlyRate } from '@/lib/format'
import { cn } from '@/lib/utils'

const ANY = '__any__'

export function ApprenticeDiscoverPage() {
  const skillsQuery = useSkills()
  const languagesQuery = useLanguages()
  const categoriesQuery = useSkillCategories()

  const [query, setQuery] = useState('')
  const [skillId, setSkillId] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [teachingLevel, setTeachingLevel] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState<DiscoverySearchParams>({})

  const resultsQuery = useDiscoverMentors(search)
  const activeFilterCount = [skillId, languageId, teachingLevel].filter(
    Boolean,
  ).length

  function applySearch(next: Partial<DiscoverySearchParams> = {}) {
    setSearch({
      q: query.trim() || undefined,
      categoryId: search.categoryId,
      skillId: skillId || undefined,
      languageId: languageId || undefined,
      teachingLevel: (teachingLevel as TeachingLevel) || undefined,
      ...next,
    })
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    applySearch()
  }

  function onClearFilters() {
    setSkillId('')
    setLanguageId('')
    setTeachingLevel('')
    applySearch({
      skillId: undefined,
      languageId: undefined,
      teachingLevel: undefined,
    })
  }

  const mentors = resultsQuery.data ?? []

  return (
    <AppShell title="Apprentice · Discover">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discover mentors
          </h1>
          <p className="text-muted-foreground">
            Verified mentors ready to help you learn a practical skill.
          </p>
        </div>

        <form className="flex gap-2" onSubmit={onSubmit} role="search">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search mentors"
              data-testid="discover-search-input"
              className="h-11 pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, skill or topic"
              maxLength={100}
            />
          </div>
          <Button type="submit" className="h-11">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            aria-expanded={showFilters}
            aria-label="Filters"
            onClick={() => setShowFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount ? ` (${activeFilterCount})` : ''}
          </Button>
        </form>

        {showFilters ? (
          <Card className="grid gap-4 p-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Skill</Label>
              <Select
                value={skillId || ANY}
                onValueChange={(value) => setSkillId(value === ANY ? '' : value)}
              >
                <SelectTrigger data-testid="discover-skill-select">
                  <SelectValue placeholder="Any skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any skill</SelectItem>
                  {(skillsQuery.data ?? []).map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={languageId || ANY}
                onValueChange={(value) =>
                  setLanguageId(value === ANY ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {(languagesQuery.data ?? []).map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teaching level</Label>
              <Select
                value={teachingLevel || ANY}
                onValueChange={(value) =>
                  setTeachingLevel(value === ANY ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {TEACHING_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="button" onClick={() => applySearch()}>
                Apply filters
              </Button>
              <Button type="button" variant="ghost" onClick={onClearFilters}>
                Clear
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2" aria-label="Categories">
          <CategoryChip
            label="All"
            active={!search.categoryId}
            onClick={() => applySearch({ categoryId: undefined })}
          />
          {(categoriesQuery.data ?? []).map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={search.categoryId === category.id}
              onClick={() => applySearch({ categoryId: category.id })}
            />
          ))}
        </div>

        {resultsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Search failed</AlertTitle>
            <AlertDescription>{errorMessage(resultsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {resultsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : null}

        {resultsQuery.data ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {mentors.length} mentor{mentors.length === 1 ? '' : 's'} found
            </p>
            {mentors.length === 0 ? (
              <Alert>
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Try a different search, category or filter.
                </AlertDescription>
              </Alert>
            ) : (
              <div
                className={cn(
                  'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
                  resultsQuery.isPlaceholderData && 'opacity-60',
                )}
              >
                {mentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-background hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

function MentorCard({ mentor }: { mentor: DiscoveryMentorCard }) {
  const rate = formatHourlyRate(mentor.hourlyRate, mentor.currency)

  return (
    <Link
      to="/apprentice/discover/$profileId"
      params={{ profileId: mentor.id }}
      data-testid="mentor-card"
      className="group block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="flex h-full flex-col transition-shadow group-hover:shadow-md">
        <div className="flex items-start gap-3 p-4 pb-3">
          <MentorAvatar
            name={mentor.displayName}
            photoUrl={mentor.profilePhotoUrl}
            className="size-14 text-lg"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold group-hover:underline">
              {mentor.displayName}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {mentor.headline ?? 'Mentor'}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge>{mentor.expertise.skillName}</Badge>
            <Badge variant="outline">{mentor.expertise.teachingLevel}</Badge>
          </div>
          {mentor.bioExcerpt ? (
            <p className="line-clamp-2 text-sm">{mentor.bioExcerpt}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <RatingSummary
            averageRating={mentor.averageRating}
            reviewCount={mentor.reviewCount}
          />
          <div className="flex items-center gap-3">
            {mentor.hasAvailability ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                Available
              </span>
            ) : null}
            {rate ? (
              <span className="font-semibold">
                {rate}
                <span className="font-normal text-muted-foreground">/hr</span>
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}
