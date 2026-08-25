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
  userId: string
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

export type SessionStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type SessionFailureReason = 'NO_SHOW' | 'TECHNICAL_FAILURE'

export type SessionSummary = {
  id: string
  summary: string
  nextStep: string | null
  createdByUserId: string
  updatedByUserId: string | null
  createdAt: string
  updatedAt: string
}

export type MentoringSession = {
  id: string
  bookingId: string
  status: SessionStatus
  videoProvider: 'STUB' | string
  externalRoomId: string
  joinUrl: string
  mentorJoinedAt: string | null
  apprenticeJoinedAt: string | null
  startedAt: string | null
  endedAt: string | null
  failureReason: SessionFailureReason | null
  absentUserId: string | null
  reportedByUserId: string | null
  bookingStartAt: string
  bookingEndAt: string
  mentorUserId: string
  apprenticeUserId: string
  createdAt: string
  updatedAt: string
  summary: SessionSummary | null
  myFeedbackSubmitted: boolean
}

export type UpsertSessionSummaryInput = {
  summary: string
  nextStep?: string
}

export type MentorshipStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ENDED'

export type MentorshipGoalStatus = 'ACTIVE' | 'ACHIEVED' | 'CANCELLED'

export type MentorshipGoal = {
  id: string
  title: string
  description: string | null
  status: MentorshipGoalStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type Mentorship = {
  id: string
  mentorProfileId: string
  apprenticeProfileId: string
  primarySkillId: string
  primarySkillName: string
  status: MentorshipStatus
  startedAt: string
  pausedAt: string | null
  completedAt: string | null
  endedAt: string | null
  endedByUserId: string | null
  mentorUserId: string
  apprenticeUserId: string
  mentorDisplayName: string | null
  apprenticeDisplayName: string | null
  createdAt: string
  updatedAt: string
  goals: MentorshipGoal[]
}

export type ContinueMentorshipInput = {
  title?: string
  description?: string
}

export type UpsertMentorshipGoalInput = {
  title: string
  description?: string
}

export type MentorshipBookingSummary = {
  id: string
  status: BookingStatus
  startAt: string
  endAt: string
  skillId: string
}

export type MentorshipSessionSummary = {
  id: string
  bookingId: string
  status: SessionStatus
  startedAt: string | null
  endedAt: string | null
}

export type SessionFeedbackRole = 'MENTOR' | 'APPRENTICE'

export type SessionFeedback = {
  id: string
  sessionId: string
  authorUserId: string
  role: SessionFeedbackRole
  wasUseful: boolean | null
  explanationsClear: boolean | null
  progressMade: boolean | null
  wouldBookAgain: boolean | null
  apprenticeRespectful: boolean | null
  learningGoalClear: boolean | null
  wouldMentorAgain: boolean | null
  comment: string | null
  createdAt: string
  updatedAt: string
}

export type SubmitApprenticeSessionFeedbackInput = {
  wasUseful: boolean
  explanationsClear: boolean
  progressMade: boolean
  wouldBookAgain: boolean
  comment?: string
}

export type SubmitMentorSessionFeedbackInput = {
  apprenticeRespectful: boolean
  learningGoalClear: boolean
  wouldMentorAgain: boolean
  comment?: string
}

export type ProductFeedbackCategory =
  | 'CONFUSING'
  | 'MISSING'
  | 'DIFFICULT'
  | 'GENERAL'

export type SubmitProductFeedbackInput = {
  category: ProductFeedbackCategory
  message: string
  pageContext?: string
}

export type BlockEntry = {
  blockedUserId: string
  blockedDisplayName: string | null
  createdAt: string
}

export type UserReportReason =
  | 'HARASSMENT'
  | 'INAPPROPRIATE_BEHAVIOR'
  | 'SAFETY_CONCERN'
  | 'SPAM'
  | 'OTHER'

export type UserReportStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'

export type UserReportEntry = {
  id: string
  reportedUserId: string
  reportedDisplayName: string | null
  bookingId: string | null
  sessionId: string | null
  mentorshipId: string | null
  reason: UserReportReason
  description: string
  status: UserReportStatus
  createdAt: string
  resolvedAt: string | null
}

export type CreateUserReportInput = {
  reportedUserId: string
  reason: UserReportReason
  description: string
  bookingId?: string
  sessionId?: string
  mentorshipId?: string
}
