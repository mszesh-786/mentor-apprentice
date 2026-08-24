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

export const BOOKING_DURATIONS = [15, 30, 60, 90] as const
export type BookingDuration = (typeof BOOKING_DURATIONS)[number]

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type ApprenticeProfile = {
  id: string
  userId: string
  shortBio: string | null
  generalLocation: string | null
  createdAt: string
  updatedAt: string
}

export type ApprenticeProfileInput = {
  shortBio?: string
  generalLocation?: string | null
}

export type DiscoveryLanguage = {
  id: string
  code: string
  name: string
}

export type DiscoveryExpertise = {
  skillId: string
  skillName: string
  yearsExperience: number
  teachingLevel: TeachingLevel
  description: string | null
}

export type DiscoveryMentorCard = {
  id: string
  displayName: string
  headline: string | null
  generalLocation: string | null
  languages: DiscoveryLanguage[]
  expertise: DiscoveryExpertise
  hourlyRate: string | null
  currency: string | null
  hasAvailability: boolean
  identityVerified: true
  matchReasons: string[]
}

export type DiscoveryMentorDetail = {
  id: string
  displayName: string
  headline: string | null
  biography: string | null
  generalLocation: string | null
  timezone: string | null
  languages: DiscoveryLanguage[]
  expertise: DiscoveryExpertise[]
  identityVerified: true
  availability: Array<{
    dayOfWeek: string
    startTime: string
    endTime: string
    timezone: string
  }>
  hourlyRate: string | null
  currency: string | null
}

export type DiscoverySearchParams = {
  skillId: string
  languageId?: string
  teachingLevel?: TeachingLevel
}

export type AvailabilitySlot = {
  startAt: string
  endAt: string
}

export type Booking = {
  id: string
  mentorProfileId: string
  apprenticeProfileId: string
  skillId: string
  skillName: string
  relationshipId: string | null
  mentorDisplayName: string | null
  apprenticeDisplayName: string | null
  startAt: string
  endAt: string
  timezoneSnapshot: string
  status: BookingStatus
  apprenticeMessage: string | null
  declineReason: string | null
  createdAt: string
  updatedAt: string
}

export type CreateBookingInput = {
  mentorProfileId: string
  skillId: string
  startAt: string
  durationMinutes: BookingDuration
  apprenticeMessage?: string
}
