# 04 --- Product Requirements

## 4.1 Requirement Format

Each requirement should have:

  Field                 Meaning
  --------------------- -------------------------------
  ID                    Unique requirement identifier
  Name                  Short descriptive name
  Description           What the system must do
  Priority              Must / Should / Could
  Actor                 Mentor / Apprentice / Admin
  Acceptance Criteria   How we know it works
  MVP Stage             Validation A / Validation B

Use identifiers such as `AUTH-001`, `MENTOR-001`, `SKILL-001`,
`AVAIL-001`, `DISC-001`, `BOOK-001`, `SESSION-001`, `REL-001`,
`FEEDBACK-001`, and `ADMIN-001`.

## 4.2 Authentication & Accounts

### AUTH-001 --- User Registration

**Priority:** Must

The system shall allow a new user to create an account. Users initially
select Mentor or Apprentice.

**Acceptance Criteria**

``` text
GIVEN a visitor does not have an account
WHEN they successfully complete registration
THEN a user account is created
AND they are authenticated
AND their selected role is stored.
```

### AUTH-002 --- Sign In

**Priority:** Must

Registered users shall be able to sign in securely.

### AUTH-003 --- Sign Out

**Priority:** Must

Users shall be able to terminate their authenticated session.

### AUTH-004 --- Email Verification

**Priority:** Must

Users shall verify their email address before accessing protected
platform functionality.

### AUTH-005 --- Account Role

The system shall support `MENTOR`, `APPRENTICE`, and `ADMIN`. The data
model should allow a person to hold more than one role later.

## 4.3 User Profile

### USER-001 --- Basic Profile

A user shall be able to maintain display name, profile photo, general
location, timezone, languages, and biography.

### USER-002 --- Profile Editing

Users shall be able to update their profile information.

### USER-003 --- Privacy

The system shall not display a user's precise residential address
publicly.

## 4.4 Identity Verification

### VERIFY-001 --- Mentor Verification

**Priority:** Must

A mentor must complete identity verification before becoming bookable.

### VERIFY-002 --- Verification Status

The system shall maintain `NOT_STARTED`, `PENDING`, `VERIFIED`,
`FAILED`, and `REQUIRES_REVIEW`.

### VERIFY-003 --- Verification Visibility

Apprentices shall be able to see whether a mentor has completed identity
verification.

### VERIFY-004 --- Credentials Separate from Identity

Professional credentials shall not be implied by identity verification.
Credential verification is outside the first validation release.

## 4.5 Skills & Expertise

### SKILL-001 --- Skill Catalogue

**Priority:** Must

The platform shall maintain a structured catalogue of skills grouped
into categories.

### SKILL-002 --- Add Mentor Skill

Mentors shall be able to select a skill from the catalogue.

### SKILL-003 --- Expertise Information

For each skill, mentors shall be able to specify years of experience,
experience description, and teaching level.

### SKILL-004 --- Update Expertise

Mentors shall be able to update an existing skill entry.

### SKILL-005 --- Remove Expertise

Mentors shall be able to remove a skill from their profile.

### SKILL-006 --- Suggest New Skill

**Priority:** Should

If a skill does not exist, a mentor shall be able to suggest it.

### SKILL-007 --- Admin Skill Approval

An administrator shall be able to approve or reject suggested skills.

## 4.6 Mentor Profile

### MENTOR-001 --- Mentor Profile Creation

**Priority:** Must

A mentor shall be able to create a public mentor profile.

### MENTOR-002 --- Profile Publication

A profile shall become bookable only when the account and email are
verified, identity verification is complete, at least one skill and
language are selected, and availability is configured.

### MENTOR-003 --- Profile Preview

Mentors should be able to preview their profile before publication.

### MENTOR-004 --- Hourly Rate

Mentors shall be able to specify an hourly rate. For Validation Release
A, the rate may be informational only.

## 4.7 Languages

### LANG-001 --- Supported Languages

The platform shall maintain a list of supported languages.

### LANG-002 --- Mentor Languages

Mentors shall be able to select one or more languages they can use for
mentoring.

### LANG-003 --- Language Search

Apprentices shall be able to filter mentors by language.

## 4.8 Availability

### AVAIL-001 --- Weekly Availability

**Priority:** Must

Mentors shall be able to specify recurring weekly availability.

### AVAIL-002 --- Multiple Time Windows

Mentors shall be able to define multiple availability windows on the
same day.

### AVAIL-003 --- Update Availability

Mentors shall be able to edit availability.

### AVAIL-004 --- Block Date

**Priority:** Should

Mentors should be able to block specific dates.

### AVAIL-005 --- Timezones

The system shall store scheduling data consistently and display times in
the user's timezone.

### AVAIL-006 --- Prevent Double Booking

The system shall prevent overlapping confirmed bookings for the same
mentor.

## 4.9 Mentor Discovery

### DISC-001 --- Browse Skills

**Priority:** Must

Apprentices shall be able to browse available skills.

### DISC-002 --- Search Mentor by Skill

Apprentices shall be able to find mentors offering a selected skill.

### DISC-003 --- Filter by Language

Search results shall support language filtering.

### DISC-004 --- Filter by Availability

Search results shall support availability filtering.

### DISC-005 --- Teaching Level

Apprentices should be able to filter according to teaching level.

### DISC-006 --- Explainable Results

The system should be able to explain why a mentor matches the
apprentice's search using understandable criteria such as skill,
language, teaching level, and availability. No machine-learning ranking
is required for the MVP.

## 4.10 Mentor Detail Page

### DISC-010 --- Mentor Detail

The apprentice shall be able to view mentor biography, general location,
languages, expertise, experience, teaching level, verification status,
availability, rate, and feedback where available.

### DISC-011 --- Book from Profile

The apprentice shall be able to initiate a booking from the mentor
profile.

## 4.11 Booking

### BOOK-001 --- Create Booking Request

**Priority:** Must

An apprentice shall be able to request a mentoring session with a
mentor, skill, date, start time, duration, and learning goal/message.

### BOOK-002 --- Availability Validation

The system shall only allow requests for valid mentor availability.

### BOOK-003 --- Mentor Accept

A mentor shall be able to accept a booking request.

### BOOK-004 --- Mentor Decline

A mentor shall be able to decline a request.

### BOOK-005 --- Apprentice Cancel

An apprentice shall be able to cancel a booking.

### BOOK-006 --- Mentor Cancel

A mentor shall be able to cancel a booking.

### BOOK-007 --- Booking Status

The system shall maintain: `REQUESTED`, `ACCEPTED`, `CONFIRMED`,
`COMPLETED`, `DECLINED`, `CANCELLED`, and `NO_SHOW`.

### BOOK-008 --- Upcoming Bookings

Users shall be able to see upcoming bookings.

### BOOK-009 --- Booking History

Users shall be able to see previous bookings.

## 4.12 Mentoring Sessions

### SESSION-001 --- Session Creation

**Priority:** Must

A confirmed booking shall have an associated mentoring session.

### SESSION-002 --- Join Session

The mentor and apprentice shall be able to join the session from the
platform.

### SESSION-003 --- Authorization

Only participants associated with the booking shall be able to access
its session.

### SESSION-004 --- Completion

A session shall be capable of being marked completed.

### SESSION-005 --- External Video Provider

The MVP may rely on an external video service and should not implement
its own video infrastructure.

## 4.13 Mentorship Relationship

### REL-001 --- Persistent Relationship

**Priority:** Must

The platform shall represent an ongoing mentor-apprentice relationship
independently from individual bookings.

### REL-002 --- Relationship Creation

A relationship is established after the first completed session when the
participants choose to continue working together.

### REL-003 --- Relationship Skill

A mentorship relationship shall identify the primary skill being
learned.

### REL-004 --- Session History

Users shall be able to see sessions associated with a mentorship.

### REL-005 --- Shared Goal

A mentorship shall support at least one shared learning goal.

### REL-006 --- Relationship Status

The relationship shall support `ACTIVE`, `PAUSED`, `COMPLETED`, and
`ENDED`.

### REL-007 --- Continue with Mentor

After a completed session, an apprentice shall be able to easily book
another session with the same mentor.

## 4.14 Learning Goals

### GOAL-001 --- Create Goal

An apprentice shall be able to describe what they want to learn.

### GOAL-002 --- Shared Visibility

Both mentor and apprentice shall be able to view the goal.

### GOAL-003 --- Update Goal

The goal should be editable as the mentorship progresses.

### GOAL-004 --- Basic Progress

A goal may have `ACTIVE`, `ACHIEVED`, or `CANCELLED` status. The MVP
should not become a full Learning Management System.

## 4.15 Session Notes

### NOTE-001 --- Mentor Session Note

**Priority:** Should

After a session, the mentor should be able to record a lightweight
summary.

### NOTE-002 --- Next Step

The mentor should be able to suggest a next learning step.

### NOTE-003 --- Visibility

For the MVP, session summaries should be shared with both mentor and
apprentice. Private mentor notes are postponed.

## 4.16 Feedback

### FEEDBACK-001 --- Apprentice Feedback

After a completed session, the apprentice shall be able to indicate
whether the session was useful, whether explanations were clear, whether
progress was made, and whether they would book the mentor again.

### FEEDBACK-002 --- Mentor Feedback

The mentor shall also be able to provide lightweight feedback.

### FEEDBACK-003 --- One Feedback per Session

Each participant shall submit feedback no more than once per session.

### FEEDBACK-004 --- Product Feedback

The system shall separately allow users to provide feedback about the
platform itself.

## 4.17 Notifications

### NOTIFY-001 --- Booking Requested

The mentor shall be notified when an apprentice requests a booking.

### NOTIFY-002 --- Booking Accepted

The apprentice shall be notified when a booking is accepted.

### NOTIFY-003 --- Booking Declined

The apprentice shall be notified when a booking is declined.

### NOTIFY-004 --- Booking Cancelled

Both relevant participants shall be notified when a booking is
cancelled.

### NOTIFY-005 --- Session Reminder

Both participants should receive a reminder before an upcoming session.

### NOTIFY-006 --- Session Complete

Users should be prompted for feedback after session completion.

MVP channels are email and in-app notifications.

## 4.18 Trust & Safety

### SAFETY-001 --- Report User

**Priority:** Must

A participant shall be able to report another participant.

### SAFETY-002 --- Block User

A user shall be able to block another user.

### SAFETY-003 --- Admin Suspension

Administrators shall be able to suspend accounts.

### SAFETY-004 --- Reporting Reason

Reports shall include a reason, description, and related booking/session
where applicable.

### SAFETY-005 --- Suspended Mentor

A suspended mentor shall not appear as bookable.

## 4.19 Administration

### ADMIN-001 --- View Users

An administrator shall be able to view registered users.

### ADMIN-002 --- View Mentor

An administrator shall be able to inspect mentor profile and
verification status.

### ADMIN-003 --- Suspend User

An administrator shall be able to suspend a user.

### ADMIN-004 --- Manage Skills

An administrator shall be able to add, edit, disable, and approve
suggested skills.

### ADMIN-005 --- View Bookings

An administrator shall be able to inspect bookings for support purposes.

### ADMIN-006 --- View Reports

An administrator shall be able to review user reports.

## 4.20 Payments --- Validation Stage B

Real marketplace payments are intentionally separated from the first
validation release.

### PAY-001 --- Mentor Rate

Mentors shall specify their hourly rate.

### PAY-002 --- Session Price

The system shall calculate the session price based on the mentor's rate
and session duration.

### PAY-003 --- Stripe Connect

Real marketplace payments shall use Stripe Connect.

### PAY-004 --- Platform Fee

Platform fees shall be visible before purchase.

### PAY-005 --- Payment Status

The payment domain should support `PENDING`, `AUTHORIZED`, `PAID`,
`REFUNDED`, and `FAILED`.

### PAY-006 --- Mentor Payout

Payment shall be released according to the payment policy after
successful session completion. Payment implementation shall not block
Validation Release A.

## 4.21 Accessibility Requirements

### ACCESS-001 --- WCAG Target

Critical journeys shall target WCAG 2.2 AA.

### ACCESS-002 --- Keyboard Navigation

The interface shall support keyboard navigation.

### ACCESS-003 --- Form Accessibility

Forms shall provide clear labels and understandable error messages.

### ACCESS-004 --- Interaction Targets

Important controls shall provide sufficiently large target areas.

### ACCESS-005 --- Color Independence

The interface shall not depend exclusively on color to communicate
state.

### ACCESS-006 --- Readable Typography

Typography shall remain comfortably readable without requiring browser
zoom.

### ACCESS-007 --- Onboarding Progress

Multi-step onboarding should clearly communicate progress and allow
users to resume where practical.

## 4.22 Validation Instrumentation

### ANALYTICS-001

Record successful mentor registration.

### ANALYTICS-002

Record mentor onboarding completion.

### ANALYTICS-003

Record mentor profile publication.

### ANALYTICS-004

Record skill searches.

### ANALYTICS-005

Record mentor profile views.

### ANALYTICS-006

Record booking requests.

### ANALYTICS-007

Record booking acceptance.

### ANALYTICS-008

Record session completion.

### ANALYTICS-009

Record repeat bookings.

### ANALYTICS-010

Record mentorship relationship creation.

The system should avoid collecting unnecessary sensitive information
merely because analytics tooling makes it possible.

## 4.23 MVP Requirement Priority

Every requirement should be assigned one of four priorities:

-   **MUST** --- The MVP does not work without it.
-   **SHOULD** --- Important for meaningful validation, but the earliest
    demo can operate without it.
-   **COULD** --- Useful if development capacity allows.
-   **LATER** --- Explicitly excluded from the current validation
    release.

  Area                      Priority
  ------------------------- ------------------------------
  Registration              MUST
  Mentor profile            MUST
  Skills                    MUST
  Availability              MUST
  Mentor search             MUST
  Booking                   MUST
  Video session             MUST
  Mentorship continuity     MUST
  Shared goals              MUST
  Basic feedback            MUST
  Admin basics              MUST
  Identity verification     MUST before external testing
  Notifications             SHOULD
  Session notes             SHOULD
  Skill suggestion          SHOULD
  Real Stripe payments      LATER / Validation B
  Credential verification   LATER
  AI matching               LATER
  Mobile application        LATER

## 4.24 Definition of MVP Complete

The MVP is functionally complete when a new mentor and a new apprentice,
without developer intervention, can:

1.  register;
2.  complete the required onboarding;
3.  establish a mentor profile;
4.  add expertise and availability;
5.  publish the mentor profile;
6.  discover the mentor through a skill search;
7.  view the mentor profile and availability;
8.  arrange a valid mentoring session;
9.  join the session;
10. complete the session;
11. provide feedback; and
12. continue through a persistent mentorship relationship.

This end-to-end journey is the primary functional definition of
completion for Validation Release A.
