# 05 — Domain Model

## 5.1 Purpose

The domain model defines the core concepts of the Mentor–Apprentice platform, their responsibilities, relationships, ownership boundaries, and lifecycle.

The model should remain independent of implementation details such as PostgreSQL tables, Prisma models, REST endpoints, or React components.

The main goals are to:

- establish a shared vocabulary for the system;
- identify which concepts have their own lifecycle and state;
- distinguish long-lived mentorship relationships from individual bookings and sessions;
- define ownership and consistency boundaries;
- clarify where business rules belong;
- provide the foundation for later API and database design.

---

# 5.2 Core Domain Areas

The MVP can be divided into the following domain areas:

1. Identity and Users
2. Mentor Profiles
3. Skills and Expertise
4. Availability
5. Discovery
6. Mentorship Relationships
7. Bookings
8. Sessions
9. Feedback
10. Verification
11. Notifications
12. Trust and Safety
13. Payments - Validation Stage B

Conceptually:

```text
User
 │
 ├──────── MentorProfile
 │             │
 │             ├── MentorExpertise
 │             │       └── Skill
 │             │
 │             ├── MentorLanguage
 │             ├── Availability
 │             └── Verification
 │
 └──────── ApprenticeProfile

MentorProfile
      │
      │
      └──── MentorshipRelationship ──── ApprenticeProfile
                       │
                       ├── Goal
                       ├── Session
                       │      │
                       │      └── Booking
                       │
                       └── Relationship History

Booking
   │
   ├── Mentor
   ├── Apprentice
   ├── Skill
   ├── Time Slot
   └── Session

Session
   │
   ├── Video Room
   ├── Session Summary
   └── Feedback

Later:

Booking
   └── Payment
          ├── Platform Fee
          ├── Refund
          └── Mentor Payout
```

---

# 5.3 User

`User` represents the authenticated human identity within the platform.

It should not itself represent a mentor or apprentice.

A person may eventually participate in both roles.

### Core attributes

```text
User
----
id
authProviderId
email
emailVerified
displayName
timezone
locale
status
createdAt
updatedAt
```

### Status

```text
ACTIVE
SUSPENDED
DEACTIVATED
```

### Roles

A user may have:

```text
MENTOR
APPRENTICE
ADMIN
```

Roles should not necessarily be represented by a single `role` column because the long-term model should allow a person to be both mentor and apprentice.

### Responsibilities

`User` owns:

- platform identity;
- authentication association;
- account status;
- basic personal settings;
- roles.

It should **not** own:

- mentor expertise;
- bookings;
- mentorship goals;
- payments;
- detailed verification data.

Those belong to their respective domains.

---

# 5.4 Mentor Profile

`MentorProfile` represents the public and operational identity of a user acting as a mentor.

```text
User
  │
  └── MentorProfile
```

A User may have zero or one MentorProfile.

### Example attributes

```text
MentorProfile
-------------
id
userId
headline
biography
generalLocation
profilePhoto
hourlyRate
currency
publicationStatus
createdAt
updatedAt
```

### Publication status

```text
DRAFT
READY
PUBLISHED
UNPUBLISHED
SUSPENDED
```

A mentor profile should not become `PUBLISHED` or bookable until the relevant requirements are satisfied.

For example:

```text
Email verified
      +
Identity verified
      +
At least one expertise
      +
At least one language
      +
Availability configured
      =
Eligible for publication
```

The exact rule belongs in the business-rules section, but the domain model must support it.

---

# 5.5 Apprentice Profile

`ApprenticeProfile` represents information relevant to a user participating as a learner.

It should initially be deliberately lightweight.

```text
ApprenticeProfile
-----------------
id
userId
shortBio
generalLocation
createdAt
updatedAt
```

A User may have zero or one ApprenticeProfile.

Learning goals should generally belong to mentorship relationships rather than becoming permanent attributes of the apprentice.

---

# 5.6 Skill Category

`SkillCategory` provides structured organisation for the skill catalogue.

Example:

```text
Automotive
Languages
Home & Trades
Technology
Business
Cooking
Crafts
```

### Attributes

```text
SkillCategory
-------------
id
name
description
status
sortOrder
```

---

# 5.7 Skill

`Skill` represents something a mentor may teach and an apprentice may seek.

Example:

```text
Automotive
     │
     ├── Basic Car Maintenance
     ├── Engine Maintenance
     └── Vehicle Diagnostics
```

### Attributes

```text
Skill
-----
id
categoryId
name
description
status
createdAt
```

### Status

```text
ACTIVE
PENDING_APPROVAL
DISABLED
```

A Skill is a catalogue entity.

It should not contain mentor-specific data such as years of experience.

---

# 5.8 Mentor Expertise

`MentorExpertise` connects a MentorProfile to a Skill and describes the mentor's individual experience with that skill.

This is more than a simple many-to-many join.

```text
MentorProfile
      │
      │
      └── MentorExpertise
                 │
                 └── Skill
```

### Attributes

```text
MentorExpertise
---------------
id
mentorProfileId
skillId
yearsExperience
description
teachingLevel
status
createdAt
updatedAt
```

### Teaching levels

For the MVP:

```text
BEGINNER
INTERMEDIATE
ADVANCED
```

A mentor can update or remove their expertise without changing the global Skill definition.

---

# 5.9 Language

`Language` is a platform catalogue entity.

Examples:

```text
English
Finnish
German
Japanese
Korean
Arabic
Hindi
```

Mentors can associate themselves with one or more languages.

The association may eventually include proficiency.

For the MVP:

```text
MentorLanguage
--------------
mentorProfileId
languageId
```

Later:

```text
proficiency
nativeSpeaker
```

can be added if validation shows they are useful.

---

# 5.10 Availability

`Availability` describes when a mentor generally accepts bookings.

Availability and Booking must remain separate concepts.

```text
Mentor
   │
   ├── Weekly Availability
   │
   └── Booking
```

### Weekly availability

Example:

```text
Monday
10:00 - 13:00

Wednesday
14:00 - 18:00
```

Conceptually:

```text
AvailabilityRule
----------------
id
mentorProfileId
dayOfWeek
startLocalTime
endLocalTime
timezone
status
```

### Availability exceptions

A mentor may need to block a particular date.

```text
AvailabilityException
---------------------
id
mentorProfileId
date
startTime
endTime
type
```

Potential types:

```text
UNAVAILABLE
AVAILABLE_OVERRIDE
```

For MVP, only `UNAVAILABLE` may be required.

Availability answers:

> "When does the mentor normally work?"

A Booking answers:

> "What time has actually been reserved?"

These should never be conflated.

---

# 5.11 Mentorship Relationship

`MentorshipRelationship` is one of the most important domain entities in the system.

It represents an ongoing relationship between one mentor and one apprentice around a particular learning context.

It is **not derived from booking history**.

It has its own identity, state, and lifecycle.

```text
Mentor
   │
   │
   └──── MentorshipRelationship
                     │
                     └──── Apprentice
```

### Attributes

```text
MentorshipRelationship
----------------------
id
mentorProfileId
apprenticeProfileId
primarySkillId
status
startedAt
pausedAt
completedAt
endedAt
createdAt
updatedAt
```

### Status

```text
PROPOSED
ACTIVE
PAUSED
COMPLETED
ENDED
```

### Why it is first-class

It owns relationship-specific state such as:

- shared learning goals;
- relationship history;
- progress;
- sessions;
- continuity;
- current learning focus.

Without this entity, the platform would primarily model individual transactions rather than mentorship.

---

# 5.12 Relationship Creation

For MVP, a relationship could be created:

```text
First booking requested
        ↓
Booking accepted
        ↓
First session occurs
        ↓
Continue together?
        ↓
YES
        ↓
MentorshipRelationship becomes ACTIVE
```

Alternatively, the system could create a provisional relationship earlier.

The exact creation point should be finalized in **Section 06 - Business Rules**.

The domain model simply establishes that the relationship exists independently once created.

---

# 5.13 Mentorship Goal

A `MentorshipGoal` belongs to a MentorshipRelationship.

Example:

> Become confident performing routine vehicle maintenance.

```text
MentorshipRelationship
          │
          └── MentorshipGoal
```

### Attributes

```text
MentorshipGoal
--------------
id
relationshipId
title
description
status
createdByUserId
createdAt
updatedAt
completedAt
```

### Status

```text
ACTIVE
ACHIEVED
CANCELLED
```

For the MVP, multiple historical goals may exist but only a small number should be active at one time.

The product should avoid becoming a full learning-management system.

---

# 5.14 Booking

`Booking` represents a request to reserve a specific mentor's time.

Booking is transactional.

MentorshipRelationship is relational.

They should remain separate.

```text
MentorshipRelationship
        │
        ├── Booking 1
        ├── Booking 2
        ├── Booking 3
        └── Booking 4
```

A first booking may exist before a formal MentorshipRelationship exists.

Therefore the relationship link may initially be optional.

### Attributes

```text
Booking
-------
id
mentorProfileId
apprenticeProfileId
skillId
relationshipId?
startAt
endAt
timezoneSnapshot
status
apprenticeMessage
createdAt
updatedAt
```

### Status

Initially:

```text
REQUESTED
ACCEPTED
CONFIRMED
COMPLETED
DECLINED
CANCELLED
NO_SHOW
```

Later, payment states should not simply be added to this status.

Payments have their own lifecycle.

---

# 5.15 Why Skill Is Stored on Booking

Even if the booking belongs to a MentorshipRelationship, the selected Skill should be recorded on the Booking.

This preserves historical context.

For example, a relationship may evolve:

```text
Relationship:
Automotive mentoring

Session 1:
Basic Car Maintenance

Session 2:
Oil and Filters

Session 3:
Vehicle Diagnostics
```

A booking should therefore retain what the session was actually intended to cover.

---

# 5.16 Session

`Session` represents the actual mentoring interaction.

A Booking reserves time.

A Session represents what actually occurred.

```text
Booking
   │
   └── Session
```

### Attributes

```text
Session
-------
id
bookingId
relationshipId?
videoProvider
externalRoomId
startedAt
endedAt
status
createdAt
```

### Status

Potentially:

```text
NOT_STARTED
READY
IN_PROGRESS
COMPLETED
FAILED
```

Avoid overcomplicating this lifecycle until the video provider is selected.

---

# 5.17 Session Summary

A completed Session may have a lightweight shared summary.

```text
SessionSummary
--------------
id
sessionId
summary
nextStep
createdByUserId
createdAt
updatedAt
```

For the MVP, these notes should be shared.

Private mentor notes should be postponed unless user research demonstrates a clear requirement.

---

# 5.18 Feedback

`Feedback` is associated primarily with a completed Session.

```text
Session
   │
   ├── Apprentice Feedback
   │
   └── Mentor Feedback
```

Conceptually:

```text
Feedback
--------
id
sessionId
authorUserId
recipientUserId
role
helpful?
clear?
progress?
wouldMeetAgain?
comment?
createdAt
```

The exact fields may vary between mentor and apprentice.

The important domain rules include:

- only session participants can submit feedback;
- feedback requires a completed session;
- each participant may submit feedback once per session.

---

# 5.19 Product Feedback

Feedback about the platform itself should be represented separately from interpersonal/session feedback.

```text
ProductFeedback
---------------
id
userId
category
message
pageOrContext
createdAt
```

This distinction matters because:

```text
"The mentor was unclear."
```

and

```text
"I couldn't understand how to change my availability."
```

measure different things.

---

# 5.20 Verification

`Verification` represents verification processes associated with a user.

The model should support different verification types.

```text
Verification
------------
id
userId
type
provider
providerReference
status
submittedAt
verifiedAt
createdAt
```

### Type

```text
IDENTITY
CREDENTIAL
```

For the MVP, only `IDENTITY` is mandatory.

### Status

```text
NOT_STARTED
PENDING
VERIFIED
FAILED
REQUIRES_REVIEW
```

This allows credential verification to be introduced later without redesigning the entire model.

---

# 5.21 Notification

`Notification` represents an event communicated to a user.

```text
Notification
------------
id
userId
type
channel
status
relatedEntityType
relatedEntityId
createdAt
readAt
```

Examples:

```text
BOOKING_REQUESTED
BOOKING_ACCEPTED
BOOKING_DECLINED
BOOKING_CANCELLED
SESSION_REMINDER
FEEDBACK_REQUESTED
```

Channels initially:

```text
IN_APP
EMAIL
```

---

# 5.22 User Report

`UserReport` represents a trust-and-safety concern submitted by a participant.

```text
UserReport
----------
id
reporterUserId
reportedUserId
bookingId?
sessionId?
reason
description
status
createdAt
resolvedAt
```

### Status

```text
OPEN
UNDER_REVIEW
RESOLVED
DISMISSED
```

An admin may review reports manually during validation.

---

# 5.23 User Block

`UserBlock` prevents unwanted interaction between two users.

```text
UserBlock
---------
blockerUserId
blockedUserId
createdAt
```

The matching/discovery domain must respect this relationship.

For example, a blocked mentor should not appear to that apprentice as someone they can book.

---

# 5.24 Payment - Validation Stage B

Payment should exist conceptually in the domain model even though real payments are postponed from Validation A.

This avoids later attaching payment concepts incorrectly to Booking.

```text
Booking
   │
   └── Payment
          │
          ├── Platform Fee
          ├── Refund
          └── Payout
```

Conceptually:

```text
Payment
-------
id
bookingId
payerUserId
amount
currency
platformFee
status
provider
providerReference
createdAt
```

Potential status:

```text
PENDING
AUTHORIZED
CAPTURED
REFUNDED
FAILED
```

Mentor payout is a different concept:

```text
Payout
------
id
paymentId
mentorUserId
amount
status
providerReference
createdAt
```

The exact Stripe Connect model should be designed later after determining the intended marketplace payment flow.

---

# 5.25 Aggregate Boundaries

For the NestJS implementation, we should think in terms of consistency boundaries rather than turning every table into an independent module.

The likely conceptual aggregates are:

### User Aggregate

```text
User
 ├── Roles
 └── Account Status
```

### Mentor Profile Aggregate

```text
MentorProfile
 ├── MentorExpertise[]
 ├── MentorLanguages[]
 └── Publication Status
```

Availability may either belong here or be handled as a separate scheduling aggregate depending on complexity.

### Mentorship Aggregate

```text
MentorshipRelationship
 ├── Goals[]
 └── Relationship State
```

Sessions and bookings reference the relationship but should not necessarily live inside the same aggregate because they have independent lifecycles.

### Booking Aggregate

```text
Booking
 ├── Requested Time
 ├── Participants
 ├── Skill
 └── Booking State
```

### Session Aggregate

```text
Session
 └── SessionSummary
```

### Verification Aggregate

```text
Verification
```

### Payment Aggregate - Later

```text
Payment
 ├── Refunds
 └── Payout references
```

These boundaries should remain relatively small.

We should avoid creating one enormous "Mentorship" aggregate containing every booking, session, goal, message, feedback item, and payment.

---

# 5.26 Entity Relationship Summary

The initial relationship structure is:

```text
User
 ├── 0..1 MentorProfile
 └── 0..1 ApprenticeProfile


MentorProfile
 ├── * MentorExpertise
 │       └── 1 Skill
 │
 ├── * Languages
 ├── * AvailabilityRules
 └── * MentorshipRelationships


ApprenticeProfile
 └── * MentorshipRelationships


MentorshipRelationship
 ├── 1 Mentor
 ├── 1 Apprentice
 ├── 1 Primary Skill
 ├── * Goals
 ├── * Bookings
 └── * Sessions


Booking
 ├── 1 Mentor
 ├── 1 Apprentice
 ├── 1 Skill
 ├── 0..1 MentorshipRelationship
 └── 0..1 Session


Session
 ├── 1 Booking
 ├── 0..1 Summary
 └── 0..2 Feedback


User
 ├── * Verifications
 ├── * Notifications
 ├── * Reports
 └── * Blocks
```

---

# 5.27 Important Domain Invariants

Before moving into business rules, the domain model establishes several important invariants.

### Identity

A MentorProfile must always belong to a User.

### Expertise

MentorExpertise must always reference an existing Skill.

### Booking

A Booking always has exactly:

- one mentor;
- one apprentice;
- one selected skill;
- one time range.

### Session

A Session cannot exist without a Booking.

### Feedback

Feedback cannot exist without a Session.

### Mentorship

A MentorshipRelationship always connects:

- exactly one mentor;
- exactly one apprentice.

### Goals

A MentorshipGoal cannot exist outside a MentorshipRelationship.

### Continuity

Multiple Bookings and Sessions may belong to the same MentorshipRelationship.

This is the core representation of continuity.

---

# 5.28 Domain Events

Even if we do not implement a full event-driven architecture, identifying meaningful domain events now will help with notifications, analytics, and integrations.

Potential events include:

```text
UserRegistered

MentorProfileCreated
MentorProfilePublished
MentorExpertiseAdded

IdentityVerificationCompleted

BookingRequested
BookingAccepted
BookingDeclined
BookingCancelled
BookingCompleted

SessionStarted
SessionCompleted

MentorshipRelationshipCreated
MentorshipRelationshipPaused
MentorshipRelationshipCompleted

MentorshipGoalCreated
MentorshipGoalAchieved

FeedbackSubmitted

UserReported
UserSuspended
```

Later, these events can trigger:

```text
Notification
Analytics event
Email
Payment operation
Audit record
```

For example:

```text
BookingAccepted
      │
      ├── Create notification
      ├── Send email
      ├── Record analytics event
      └── Later: authorize payment
```

This keeps the core booking logic separate from secondary effects.

---

# 5.29 What the Domain Model Deliberately Does Not Include Yet

The MVP domain should not currently model:

- AI recommendations;
- AI tutors;
- courses;
- exams;
- certificates;
- subscriptions;
- group classes;
- social feeds;
- gamification;
- sophisticated reputation scores;
- physical/in-person jobs;
- tax management;
- multi-currency wallets;
- complex credential frameworks;
- messaging/chat histories unless validation shows they are required.

These can be introduced after validation without distorting the core model.

---

# 5.30 Key Decisions to Finalize in Section 06

The domain model exposes several business decisions that should be resolved next.

1. **When exactly is a MentorshipRelationship created?**
   - when booking is accepted;
   - after first completed session;
   - when users explicitly choose "continue mentorship."

2. **Can the same mentor and apprentice have multiple relationships?**

For example:

```text
David ↔ Priya
  ├── Car Maintenance mentorship
  └── English mentorship
```

My recommendation is **yes**, but only one active relationship per mentor + apprentice + primary skill.

3. **Can a mentor change their hourly rate for existing relationships?**

We need to determine whether existing apprentices receive a relationship-specific rate or always use the current mentor rate.

4. **When is a booking slot considered reserved?**

At request time or only after mentor acceptance?

5. **Who marks a session completed?**

Mentor, apprentice, system timer, or a combination?

6. **When can feedback be submitted?**

Immediately after the planned end time or only after confirmed completion?

7. **What happens to future bookings when a mentorship relationship is ended?**

8. **What does blocking another user do to existing relationships and bookings?**

9. **Can a suspended user access historical mentorship information?**

These are not database questions. They are product/business rules and should therefore be decided before implementing the schema.

---

# 5.31 Domain Model Success Criterion

Section 05 is complete when every core requirement from Section 04 can be mapped to a domain concept without introducing unnecessary implementation concepts.

The key mental model for the MVP is:

> **Users have roles. Mentors offer expertise and availability. Apprentices discover mentors and request bookings. Bookings produce sessions. Successful repeated interaction can form a persistent mentorship relationship containing goals and history.**

This domain model should serve as the foundation for Section 06 - Business Rules, followed by state machines and, only afterwards, the PostgreSQL and NestJS technical models.