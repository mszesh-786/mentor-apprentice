# 06 — Business Rules

## 6.1 Purpose

Business rules define the conditions, constraints, and decisions that govern how the Mentor–Apprentice platform behaves.

These rules sit between the product requirements and the technical implementation. They should be independent of React components, REST endpoints, NestJS controllers, and PostgreSQL tables.

The goals of this section are to:

- define when actions are allowed;
- define who may perform them;
- define how entities change state;
- prevent inconsistent or unsafe system states;
- resolve important product ambiguities before implementation;
- provide the basis for acceptance tests and state machines.

---

# 6.2 User and Role Rules

### BR-USER-001 — One Human, One User Account

A person should have one platform `User` account.

The same user may act as:

- Mentor;
- Apprentice;
- both Mentor and Apprentice;
- Administrator where explicitly authorized.

The platform should not require separate accounts for teaching and learning.

### BR-USER-002 — Multiple Roles

A user may hold multiple roles simultaneously.

Example:

```text
User
 ├── MentorProfile
 └── ApprenticeProfile
```

A user may therefore teach English while also learning carpentry.

### BR-USER-003 — Suspended Accounts

A suspended user shall not be allowed to:

- create new bookings;
- accept booking requests;
- join new mentoring sessions;
- publish or update a public mentor profile.

The user may retain limited access to account history unless access is restricted for safety or legal reasons.

### BR-USER-004 — Account Deactivation

A deactivated account shall no longer be discoverable or bookable.

Historical records should remain available where required for operational, legal, or research purposes.

---

# 6.3 Mentor Profile Rules

### BR-MENTOR-001 — Mentor Profile Ownership

A MentorProfile must belong to exactly one User.

A User may have at most one active MentorProfile.

### BR-MENTOR-002 — Draft by Default

A newly created MentorProfile starts in:

```text
DRAFT
```

It is not publicly discoverable.

### BR-MENTOR-003 — Publication Eligibility

A mentor profile may become `PUBLISHED` only when all mandatory requirements are satisfied.

For Validation Release A:

```text
Email verified
+
Identity verified
+
Profile name
+
Biography
+
At least one language
+
At least one active expertise
+
At least one availability window
=
Eligible for publication
```

### BR-MENTOR-004 — Bookable Status

A published mentor is bookable only when:

- the associated User is active;
- identity verification remains valid;
- at least one expertise is active;
- availability exists.

### BR-MENTOR-005 — Profile Unpublication

A mentor may voluntarily unpublish their profile.

When unpublished:

- they should disappear from discovery;
- existing bookings remain valid unless separately cancelled;
- existing mentorship relationships remain accessible.

### BR-MENTOR-006 — Rate Changes

A mentor may change their displayed hourly rate.

For Validation Release A, the rate is informational.

When real payments are introduced, the booking must preserve a **rate snapshot** at the time of confirmation.

Therefore changing a mentor's current rate must not alter the price of an already confirmed booking.

---

# 6.4 Skill and Expertise Rules

### BR-SKILL-001 — Catalogue Skills

Mentor expertise must reference a valid platform Skill.

Mentors should not create arbitrary public skill names directly.

### BR-SKILL-002 — Unique Expertise

A mentor should not have duplicate active MentorExpertise records for the same Skill.

Example:

```text
David
Basic Car Maintenance
```

should exist once, not multiple times.

### BR-SKILL-003 — Expertise Editing

A mentor may modify:

- years of experience;
- description;
- teaching level.

Changing MentorExpertise must not alter the global Skill.

### BR-SKILL-004 — Expertise Removal

A mentor may remove or disable an expertise.

Existing booking and session history referencing that skill must remain intact.

### BR-SKILL-005 — Skill Suggestions

A proposed skill is not publicly searchable until approved by an Administrator.

### BR-SKILL-006 — Disabled Skills

A disabled Skill:

- cannot be newly added to mentor profiles;
- should not appear in new discovery searches;
- remains referenced by historical bookings and mentorships.

---

# 6.5 Language Rules

### BR-LANG-001 — Mentor Language Requirement

A mentor must have at least one mentoring language before profile publication.

### BR-LANG-002 — Discovery Language

If an apprentice filters by language, only mentors associated with that language should appear.

### BR-LANG-003 — Language Is Not Nationality

Languages must not be inferred from location or nationality.

Mentors explicitly declare the languages they can use for mentoring.

---

# 6.6 Identity Verification Rules

### BR-VERIFY-001 — Verification Required for Mentors

A mentor may create and edit a profile before identity verification.

However, they may not become publicly bookable until identity verification status is:

```text
VERIFIED
```

### BR-VERIFY-002 — Identity vs Credential Verification

Identity verification confirms identity only.

It must never be presented as evidence that:

- a professional qualification is valid;
- the mentor is licensed;
- the mentor is competent in a regulated profession.

### BR-VERIFY-003 — Failed Verification

A mentor with:

```text
FAILED
```

verification status may not become bookable.

### BR-VERIFY-004 — Verification Review

A status of:

```text
REQUIRES_REVIEW
```

requires administrator action before the mentor may become bookable.

---

# 6.7 Availability Rules

### BR-AVAIL-001 — Availability Ownership

Availability belongs to a MentorProfile.

### BR-AVAIL-002 — Valid Time Window

An availability window must have:

```text
startTime < endTime
```

### BR-AVAIL-003 — Overlapping Availability

The system should prevent or normalize duplicate/overlapping availability windows for the same mentor.

Example:

```text
10:00 - 12:00
11:00 - 13:00
```

should either be rejected or represented as:

```text
10:00 - 13:00
```

For MVP, rejection with a clear message is simpler.

### BR-AVAIL-004 — Timezone

Each mentor availability schedule must have a defined timezone.

All absolute booking timestamps should be stored consistently in UTC.

### BR-AVAIL-005 — Specific Date Blocks

An unavailable date exception overrides recurring weekly availability.

Example:

```text
Every Monday
10:00 - 13:00

BUT
Monday 24 August
Unavailable
```

The date-specific block wins.

### BR-AVAIL-006 — Existing Booking Overrides Availability Changes

A mentor changing or deleting availability must not automatically cancel existing confirmed bookings.

Confirmed bookings are independent reservations.

---

# 6.8 Discovery Rules

### BR-DISC-001 — Discoverable Mentor

A mentor appears in apprentice discovery only if:

```text
User = ACTIVE
AND
MentorProfile = PUBLISHED
AND
IdentityVerification = VERIFIED
AND
Relevant Expertise = ACTIVE
```

### BR-DISC-002 — Skill Matching

A mentor is eligible for a skill search only if they have active MentorExpertise for that Skill.

### BR-DISC-003 — Blocked Users

Users who have blocked each other must not be offered to each other through search or recommendation.

### BR-DISC-004 — Explainable Matching

Any recommendation/ranking beyond simple filtering should be explainable using human-readable criteria.

For MVP, acceptable explanation factors include:

- skill;
- language;
- availability;
- teaching level;
- previous mentorship relationship.

### BR-DISC-005 — Existing Relationship Preference

Where appropriate, an apprentice with an active existing MentorshipRelationship may be shown their existing mentor prominently before unrelated search results.

The system should encourage continuity without preventing users from selecting another mentor.

---

# 6.9 Booking Rules

### BR-BOOK-001 — Booking Participants

Every Booking must contain exactly:

- one mentor;
- one apprentice.

A user cannot create a booking with themselves.

### BR-BOOK-002 — Booking Skill

Every Booking must reference exactly one Skill.

The mentor must have active expertise in that Skill at the time the booking is requested.

### BR-BOOK-003 — Booking Time

Every Booking must contain a valid:

- start timestamp;
- end timestamp.

The start time must precede the end time.

### BR-BOOK-004 — Booking Must Match Availability

A new booking request must fall within the mentor's available schedule unless the system later supports explicit custom-time invitations.

Custom scheduling is outside the initial MVP.

### BR-BOOK-005 — Booking Slot Reservation

For the validation MVP, a booking request should **not permanently reserve the mentor's slot until accepted**.

However, once a booking is accepted, that time range is reserved.

To avoid race conditions, the system must prevent two requests being accepted for overlapping time periods.

### BR-BOOK-006 — Multiple Pending Requests

A mentor may receive more than one pending request for overlapping time slots.

Once one is accepted, conflicting pending requests should become unavailable for acceptance.

The system may mark them:

```text
DECLINED
```

or later introduce:

```text
EXPIRED_CONFLICT
```

For MVP, automatic decline with a clear reason is acceptable.

### BR-BOOK-007 — Booking Acceptance Authority

Only the booked mentor may accept or decline a pending booking request.

### BR-BOOK-008 — Apprentice Cancellation

The apprentice may cancel:

```text
REQUESTED
ACCEPTED
CONFIRMED
```

bookings subject to later payment/cancellation policy.

For Validation Release A, cancellation is allowed without financial penalty.

### BR-BOOK-009 — Mentor Cancellation

A mentor may cancel an accepted or confirmed booking.

The apprentice must be notified.

### BR-BOOK-010 — Completed Booking

A Booking should move to `COMPLETED` only after its associated Session has been completed.

### BR-BOOK-011 — Booking History

Terminal booking states must remain in history and should not be physically deleted.

Terminal states include:

```text
COMPLETED
DECLINED
CANCELLED
NO_SHOW
```

---

# 6.10 Mentorship Relationship Rules

This is the core relational domain.

### BR-REL-001 — Separate from Booking

A MentorshipRelationship must remain independent of any single Booking.

One relationship may contain many bookings and sessions.

### BR-REL-002 — Relationship Participants

Every MentorshipRelationship has exactly:

- one MentorProfile;
- one ApprenticeProfile;
- one primary Skill.

### BR-REL-003 — One Active Relationship per Skill Pair

For MVP, the same mentor and apprentice may have multiple mentorship relationships if they concern different primary skills.

Example:

```text
David ↔ Priya
    ├── Basic Car Maintenance
    └── English Conversation
```

However, there may be at most **one ACTIVE relationship for the same mentor + apprentice + primary skill**.

This avoids duplicate parallel relationships.

### BR-REL-004 — Relationship Creation

Recommended MVP rule:

> A MentorshipRelationship is created when the participants choose to continue working together after the first completed session.

This keeps the first interaction lightweight and prevents every one-off booking from automatically becoming a mentorship.

Flow:

```text
First Session Completed
       ↓
Would you like to continue together?
       ↓
YES
       ↓
MentorshipRelationship created
       ↓
ACTIVE
```

The first completed session should then be associated with the newly created relationship for historical continuity where practical.

### BR-REL-005 — Existing Relationship Booking

If a mentor and apprentice already have an ACTIVE MentorshipRelationship for the chosen Skill, new bookings should reference that relationship.

### BR-REL-006 — Relationship Status

Allowed statuses:

```text
PROPOSED
ACTIVE
PAUSED
COMPLETED
ENDED
```

For MVP, `PROPOSED` may be omitted if creation occurs only after explicit agreement.

### BR-REL-007 — Pause Relationship

Either participant may pause a relationship.

When paused:

- historical data remains accessible;
- new sessions may not be booked through the relationship until reactivated;
- existing confirmed bookings are not automatically cancelled.

### BR-REL-008 — Complete Relationship

A relationship may be marked `COMPLETED` when its learning purpose has been achieved.

Example:

> Apprentice achieved the agreed goal.

### BR-REL-009 — End Relationship

Either participant may end a relationship at any time.

`ENDED` is distinct from `COMPLETED`.

Example:

```text
COMPLETED
Goal achieved successfully.

ENDED
Relationship stopped before intended completion.
```

### BR-REL-010 — Ending Does Not Delete History

Ending or completing a relationship must preserve:

- goals;
- previous bookings;
- sessions;
- summaries;
- historical progress.

### BR-REL-011 — Future Bookings on Relationship End

Recommended rule:

Ending a relationship should **not automatically cancel already confirmed future bookings**.

Instead, the user should be asked:

> You have future sessions with this mentor. Do you also want to cancel them?

This avoids unintended destructive actions.

---

# 6.11 Goal Rules

### BR-GOAL-001 — Relationship Ownership

A MentorshipGoal must belong to exactly one MentorshipRelationship.

### BR-GOAL-002 — Goal Creation

Either participant may propose or create a shared learning goal.

For MVP, both parties may edit the goal.

Later, collaborative approval can be introduced if necessary.

### BR-GOAL-003 — Goal Status

A goal may be:

```text
ACTIVE
ACHIEVED
CANCELLED
```

### BR-GOAL-004 — Historical Goals

Achieved and cancelled goals remain visible in mentorship history.

### BR-GOAL-005 — No Goal Required for First Session

A formal MentorshipGoal is not required to make an initial Booking.

The apprentice's booking message may describe the initial learning need.

---

# 6.12 Session Rules

### BR-SESSION-001 — Session Requires Booking

A Session may only exist for a Booking.

### BR-SESSION-002 — One Primary Session per Booking

For MVP, one Booking has at most one mentoring Session.

### BR-SESSION-003 — Session Participants

Only:

- the booked mentor;
- the booked apprentice;

may join the Session.

Administrator access should not include joining live sessions by default.

### BR-SESSION-004 — Join Window

Participants may join within a configurable time window around the scheduled session.

Example:

```text
15 minutes before start
until
session completion window expires
```

The exact values should be configurable rather than hardcoded into domain logic.

### BR-SESSION-005 — Session Completion

For the MVP, session completion should be determined using a combination of:

- scheduled end time;
- successful session start;
- explicit completion action by at least one participant.

Recommended rule:

> After the scheduled end time, either participant may mark the session complete. If neither acts, the system may automatically mark the session `COMPLETED` after a configurable grace period if attendance was recorded.

This is preferable to requiring both users to confirm every session.

### BR-SESSION-006 — Failed Session

If a session could not occur due to technical problems, it should not automatically be treated as successfully completed.

A user should be able to report:

```text
TECHNICAL_FAILURE
```

For Validation Release A, administrator review may resolve the case manually.

### BR-SESSION-007 — Session Summary

A shared session summary may only be added to a completed Session.

### BR-SESSION-008 — Session History

Completed sessions remain part of mentorship history even if the relationship later ends.

---

# 6.13 Feedback Rules

### BR-FEEDBACK-001 — Completed Sessions Only

Feedback may only be submitted for a completed Session.

### BR-FEEDBACK-002 — Participant Only

Only participants in the Session may submit feedback.

### BR-FEEDBACK-003 — One Submission per Participant

Each participant may submit feedback at most once per Session.

### BR-FEEDBACK-004 — Feedback Window

For MVP, feedback should remain available after completion rather than expiring quickly.

A future version may introduce a time limit.

### BR-FEEDBACK-005 — Product Feedback Separate

Product usability feedback must remain separate from interpersonal feedback.

---

# 6.14 Blocking Rules

### BR-BLOCK-001 — Any User May Block Another User

A user may block another user.

### BR-BLOCK-002 — Immediate Discovery Effect

Once blocked:

- users should not appear in each other's mentor discovery;
- neither user may initiate a new booking with the other.

### BR-BLOCK-003 — Existing Relationship

If either party blocks the other:

- ACTIVE mentorship relationships should move to `ENDED`;
- new sessions cannot be booked;
- historical relationship data remains available.

### BR-BLOCK-004 — Future Bookings

For safety, future uncompleted bookings between blocked users should be cancelled.

For Validation Release A, cancellation can occur without financial consequences.

When real payments are added, this rule must coordinate with refund policy.

### BR-BLOCK-005 — Notifications

The blocked user should not receive a notification saying:

> "You were blocked by X."

The platform should simply prevent further interaction.

---

# 6.15 Reporting Rules

### BR-REPORT-001 — Who May Report

Authenticated users may report another user.

### BR-REPORT-002 — Context

A report may optionally reference:

- Booking;
- Session;
- MentorshipRelationship.

### BR-REPORT-003 — Report Does Not Automatically Suspend

Submitting a report does not automatically suspend the reported user unless a later safety policy introduces high-severity automatic actions.

For MVP, administrator review is required.

### BR-REPORT-004 — Admin Resolution

An administrator may resolve a report with actions such as:

```text
NO_ACTION
WARNING
USER_SUSPENDED
USER_DEACTIVATED
```

Refund/payment actions are added in Validation Release B.

---

# 6.16 Notification Rules

### BR-NOTIFY-001 — Booking Request

A mentor must be notified when a new booking request is created.

### BR-NOTIFY-002 — Booking Decision

The apprentice must be notified when a request is:

- accepted;
- declined;
- cancelled.

### BR-NOTIFY-003 — Session Reminder

Both participants should receive a reminder before a confirmed session.

### BR-NOTIFY-004 — Feedback Prompt

Both participants should receive a feedback prompt after session completion.

### BR-NOTIFY-005 — Notification Failure

Failure to send email should not invalidate the underlying booking or session operation.

For example:

```text
Booking accepted successfully
Email delivery fails
```

The Booking remains accepted.

This distinction will be important for NestJS transaction boundaries.

---

# 6.17 Payment Rules — Validation Release B

These rules should be documented now but implemented later.

### BR-PAY-001 — Price Snapshot

A confirmed booking must store:

- mentor rate at booking time;
- duration;
- calculated session price;
- currency;
- applicable platform fee.

Future mentor rate changes must not modify the booking price.

### BR-PAY-002 — Payment Required for Confirmation

Once real payments are introduced, a booking should not become fully `CONFIRMED` until required payment authorization succeeds.

### BR-PAY-003 — Payment Lifecycle Separate from Booking

Payment state must remain independent of Booking state.

Do not create booking statuses such as:

```text
PAID
REFUNDED
```

These belong to Payment.

### BR-PAY-004 — Payment Provider Is Source of Truth for Movement

Stripe remains the external source of truth for actual payment processing events.

The platform maintains its own synchronized representation for product behavior and auditing.

### BR-PAY-005 — Idempotency

Payment operations and webhooks must be idempotent.

The same provider event processed twice must not result in:

- duplicate payments;
- duplicate refunds;
- duplicate payouts.

### BR-PAY-006 — Cancellation Policy

The precise financial cancellation policy must be finalized before Validation Release B.

It should distinguish:

- mentor cancellation;
- apprentice cancellation;
- late cancellation;
- no-show;
- technical failure.

---

# 6.18 Historical Data Rules

### BR-HISTORY-001 — No Destructive Deletion of Business Records

Bookings, Sessions, Feedback, and MentorshipRelationships should generally not be hard-deleted through normal user actions.

Their lifecycle should be represented through status.

### BR-HISTORY-002 — Profile Changes Do Not Rewrite History

Changes to:

- mentor biography;
- current rate;
- expertise;
- language;
- availability;

must not rewrite historical Booking or Session facts.

Where historical accuracy matters, snapshots should be stored.

### BR-HISTORY-003 — Skill Renaming

If an Administrator renames a Skill, historical references may show the updated catalogue name unless a later compliance requirement requires immutable display snapshots.

For MVP, this is acceptable.

---

# 6.19 Validation and Audit Rules

### BR-AUDIT-001 — Important Actions

The system should record important lifecycle events such as:

```text
MentorProfilePublished
VerificationCompleted
BookingRequested
BookingAccepted
BookingCancelled
SessionCompleted
MentorshipRelationshipCreated
MentorshipRelationshipEnded
UserSuspended
```

### BR-AUDIT-002 — Actor

Where relevant, an audit event should identify who performed the action.

### BR-AUDIT-003 — Research Analytics Separation

Operational audit logs and product/research analytics should remain conceptually separate.

Audit asks:

> What happened to the system?

Research/product analytics asks:

> How are users interacting with the product?

---

# 6.20 MVP Policy Decisions

The following decisions are now recommended as the baseline for implementation.

| Question | MVP Decision |
|---|---|
| Is MentorshipRelationship separate from Booking? | Yes |
| Can users be both Mentor and Apprentice? | Yes |
| When is a relationship created? | After first completed session when users choose to continue |
| Can same pair have multiple relationships? | Yes, for different primary skills |
| Same pair + same skill active twice? | No |
| Does pending booking reserve a slot? | No |
| Does accepted booking reserve a slot? | Yes |
| Can mentor change rate? | Yes; confirmed bookings preserve old rate |
| Who completes session? | Either participant after session; later auto-completion possible |
| Is feedback allowed before completion? | No |
| Does ending relationship cancel future bookings? | Not automatically |
| Does blocking end relationship? | Yes |
| Does blocking cancel future bookings? | Yes |
| Is credential verification required? | No for initial MVP |
| Is identity verification required for public mentors? | Yes |
| Are real payments required for Validation A? | No |

---

# 6.21 Critical Invariants

The application must never allow the following invalid states.

### Booking invariant

```text
One mentor
+
One apprentice
+
One skill
+
Valid time range
```

### No self-booking

```text
mentor.userId != apprentice.userId
```

### No double booking

A mentor must not have overlapping accepted/confirmed bookings.

### Published mentor invariant

A publicly bookable mentor must have:

```text
ACTIVE User
+
PUBLISHED MentorProfile
+
VERIFIED Identity
+
Active Expertise
```

### Mentorship invariant

An ACTIVE MentorshipRelationship must have:

```text
one mentor
+
one apprentice
+
one primary skill
```

and must not duplicate another ACTIVE relationship for the same combination.

### Feedback invariant

```text
Feedback
→ Completed Session
→ Author participated in that Session
```

### Session invariant

```text
Session
→ Booking
```

A Session must never exist independently.

---

# 6.22 Business Rule Enforcement Strategy

Not every rule should be enforced in the same place.

Later, when we design NestJS, rules will generally fall into three levels.

### Database constraints

Use for structural invariants.

Examples:

- required foreign keys;
- uniqueness constraints;
- valid relationships.

### Domain/application services

Use for contextual business logic.

Examples:

- can this booking be accepted?
- does it overlap an existing booking?
- may this mentor publish?
- can this relationship be created?

### Authorization layer

Use for actor permissions.

Examples:

- only this mentor may accept this request;
- only relationship participants may view goals;
- only admins may suspend users.

This separation should be preserved during implementation.

---

# 6.23 Business Rules Success Criterion

Section 06 is complete when the platform's key actions have predictable answers to:

- Who may perform the action?
- Under what conditions?
- What state changes?
- What happens to related entities?
- What must remain historically preserved?
- What happens when the action fails?

At this point, the domain should be sufficiently defined to move into **Section 07 — State Machines**, where the main lifecycles will be represented explicitly for:

1. MentorProfile
2. Verification
3. Booking
4. Session
5. MentorshipRelationship
6. MentorshipGoal
7. UserReport
8. Payment - later