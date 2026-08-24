export type PublicationStatus =
  | 'DRAFT'
  | 'READY'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'SUSPENDED'

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'REQUIRES_REVIEW'

export type TeachingLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type Language = {
  id: string
  code: string
  name: string
  sortOrder: number
}

export type SkillCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  sortOrder: number
}

export type Skill = {
  id: string
  slug: string
  name: string
  description: string | null
  sortOrder: number
  category: SkillCategory
}

export type MentorExpertise = {
  id: string
  skillId: string
  yearsExperience: number
  description: string | null
  teachingLevel: TeachingLevel
  status: 'ACTIVE' | 'DISABLED'
  skill: Skill
}

export type PublicationRequirement = {
  code: string
  label: string
  satisfied: boolean
}

export type PublicationEligibility = {
  eligible: boolean
  requirements: PublicationRequirement[]
}

export type MentorProfile = {
  id: string
  userId: string
  headline: string | null
  biography: string | null
  generalLocation: string | null
  timezone: string | null
  profilePhotoUrl: string | null
  hourlyRate: string | null
  currency: string | null
  publicationStatus: PublicationStatus
  languages: Language[]
  expertise: MentorExpertise[]
  identityVerification: { status: VerificationStatus }
  hasAvailability: boolean
  publicationEligibility: PublicationEligibility
  isBookable: boolean
  createdAt: string
  updatedAt: string
}

export type AvailabilityRule = {
  id: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  timezone: string
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  updatedAt: string
}

export type IdentityVerification = {
  status: VerificationStatus
  type: 'IDENTITY' | 'CREDENTIAL'
  provider: 'STUB' | null
  submittedAt: string | null
  verifiedAt: string | null
}

export type ProfileInput = {
  displayName?: string
  headline?: string
  biography?: string
  generalLocation?: string
  timezone?: string
  profilePhotoUrl?: string
  hourlyRate?: number | null
  currency?: string | null
}

export type ExpertiseInput = {
  skillId: string
  yearsExperience: number
  description?: string
  teachingLevel: TeachingLevel
}

export type AvailabilityRuleInput = {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  timezone?: string
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export const TEACHING_LEVELS: TeachingLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]
