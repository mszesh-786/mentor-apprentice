# 03 — Actors & User Journeys

## 3.1 Purpose

This section defines the primary actors interacting with the Mentor–Apprentice platform and the journeys they must be able to complete within the MVP.

The system is designed around two primary participants:

- **Mentor** — a person offering knowledge, experience, or skills.
- **Apprentice** — a person seeking to learn from a mentor.

A third actor, the **Administrator**, supports platform operation, verification, skill management, and basic trust and safety.

The MVP should optimize for completing a small number of important journeys reliably rather than supporting every possible interaction.

The central journey is:

**Mentor becomes discoverable → Apprentice finds Mentor → Session is arranged → Human interaction occurs → Both provide feedback → Relationship continues.**

---

# 3.2 Actor: Mentor

## Description

A Mentor is a user who wants to share knowledge or experience with apprentices.

Although the platform is motivated particularly by participation among retired and older adults, the technical role should be defined as `MENTOR` rather than encoding age into the account model.

A mentor may have expertise acquired through:

- professional employment;
- trades;
- hobbies;
- entrepreneurship;
- education;
- crafts;
- languages;
- life experience;
- community activities.

Examples include:

- automotive mechanic;
- plumber;
- carpenter;
- engineer;
- accountant;
- teacher;
- chef;
- gardener;
- tailor;
- electrician;
- language speaker;
- business owner.

## Primary Mentor Goals

A mentor wants to:

- present their experience clearly;
- identify what they can teach;
- decide when they are available;
- control who they mentor;
- understand what an apprentice wants to learn;
- conduct mentoring sessions;
- maintain relationships with apprentices;
- track shared goals;
- receive recognition for their expertise;
- eventually receive compensation for their time.

---

# 3.3 Mentor Journey 1 — Registration

### Goal

Create an account and indicate an intention to become a mentor.

### Journey

```text
Landing Page
     ↓
Register
     ↓
Create Account
     ↓
Choose Role
     ↓
Mentor
     ↓
Verify Email
     ↓
Mentor Onboarding
```

### Information collected

Only essential account information should be collected initially:

- name;
- email;
- authentication credentials through the identity provider;
- role.

Detailed mentor information should be collected through onboarding rather than making registration excessively long.

### Successful outcome

The system creates a user account associated with the Mentor role.

---

# 3.4 Mentor Journey 2 — Identity Verification

### Goal

Establish a basic level of trust before becoming bookable.

### Journey

```text
Mentor Dashboard
       ↓
Complete Verification
       ↓
Verification Provider
       ↓
Verification Result
       ↓
Verified / Requires Review
```

### States

A mentor may have:

```text
NOT_STARTED
PENDING
VERIFIED
FAILED
REQUIRES_REVIEW
```

### Important distinction

Identity verification confirms identity.

It does **not** confirm professional expertise.

The platform must not imply:

> Identity Verified = Professionally Qualified

These concepts remain separate.

### Successful outcome

The mentor receives an identity-verified status and can proceed toward publishing their profile.

---

# 3.5 Mentor Journey 3 — Create Mentor Profile

### Goal

Create a profile that enables apprentices to understand who the mentor is and what they can offer.

### Journey

```text
Start Profile
     ↓
Profile Photo
     ↓
About Me
     ↓
General Location
     ↓
Languages
     ↓
Skills
     ↓
Experience
     ↓
Availability
     ↓
Rate
     ↓
Preview
     ↓
Publish
```

### Profile information

The mentor can provide:

- profile photo;
- display name;
- short biography;
- general location;
- time zone;
- languages;
- professional/personal background;
- skills;
- experience for each skill;
- teaching level;
- availability;
- hourly rate where applicable.

### Profile completion

The system should display progress.

For example:

```text
Profile Completion

Account          ✓
Identity         ✓
About You        ✓
Languages        ✓
Skills           ✓
Availability     ○

83% Complete
```

This may be particularly useful for reducing onboarding uncertainty.

---

# 3.6 Mentor Journey 4 — Add Expertise

### Goal

Describe the skills the mentor can teach.

### Journey

```text
My Skills
    ↓
Add Skill
    ↓
Search Skill Catalogue
    ↓
Select Skill
    ↓
Describe Experience
    ↓
Teaching Level
    ↓
Save
```

Example:

```text
Skill
Basic Car Maintenance

Experience
32 years

Description
Worked as an automotive mechanic specialising
in vehicle servicing and engine maintenance.

Can Teach
Beginner
Intermediate
```

The mentor can subsequently:

- add another skill;
- update expertise;
- remove expertise.

### Skill not found

If a skill does not exist:

```text
Search Skill
     ↓
No Suitable Skill
     ↓
Suggest New Skill
     ↓
Admin Review
```

For the validation MVP, approval may be performed manually.

---

# 3.7 Mentor Journey 5 — Manage Availability

### Goal

Tell apprentices when mentoring sessions can occur.

### Journey

```text
Availability
     ↓
Select Day
     ↓
Add Time Range
     ↓
Repeat for Other Days
     ↓
Save
```

Example:

```text
Monday
10:00 – 13:00

Wednesday
14:00 – 18:00

Saturday
09:00 – 12:00
```

Mentors should also be able to:

- remove availability;
- temporarily mark themselves unavailable;
- block a specific date.

The interface should clearly display the mentor's own timezone.

---

# 3.8 Mentor Journey 6 — Receive Booking Request

### Goal

Understand an apprentice's request and decide whether to accept it.

### Journey

```text
Booking Request
      ↓
View Apprentice
      ↓
View Requested Skill
      ↓
View Learning Goal
      ↓
View Date / Time
      ↓
Accept / Decline
```

Example:

```text
Priya would like a session.

Skill:
Basic Car Maintenance

Learning Goal:
"I recently bought my first car and want to
understand basic maintenance."

Requested:
Wednesday
16:00 – 17:00

[Decline]       [Accept]
```

The mentor should not need to accept every request.

Mentor autonomy is a core product principle.

---

# 3.9 Mentor Journey 7 — Prepare for Session

### Goal

Understand what the apprentice wants before the session begins.

The mentor sees:

- apprentice;
- skill;
- learning goal;
- scheduled time;
- previous sessions, if applicable;
- existing mentorship goal;
- join-session action.

For repeat apprentices, the mentor should see continuity information.

Example:

```text
Priya

Mentorship:
Basic Car Maintenance

Goal:
Become confident with routine vehicle maintenance.

Previous Session:
Checking tyre pressure and fluid levels.

Next Session:
Oil and filter basics.
```

---

# 3.10 Mentor Journey 8 — Conduct Session

### Goal

Participate in the actual human-to-human mentoring interaction.

### Journey

```text
Upcoming Session
       ↓
Join
       ↓
Video / Voice Session
       ↓
Session Ends
       ↓
Mark Complete
```

The MVP may use an external video provider.

The platform should provide the context surrounding the video interaction rather than attempting to build video infrastructure itself.

---

# 3.11 Mentor Journey 9 — Complete Session

After the session, the mentor can record lightweight information.

For example:

```text
Session completed.

What did you cover?

[Basic engine oil checks              ]

Suggested next step:

[Changing oil and filter              ]

Would you mentor this apprentice again?

Yes / No
```

These notes should not become burdensome.

The purpose is relationship continuity, not administrative documentation.

---

# 3.12 Mentor Journey 10 — Continue Mentorship

### Goal

Continue working with the same apprentice.

```text
Completed Session
       ↓
Continue Mentorship
       ↓
Shared Goal
       ↓
Book Another Session
       ↓
Progress Over Time
```

This is one of the most important journeys in the system.

The platform should make continuing an existing relationship easier than searching for a new mentor again.

---

# 3.13 Actor: Apprentice

## Description

An Apprentice is a user seeking knowledge, guidance, or practical skill development.

An apprentice may be:

- a student;
- young professional;
- career changer;
- hobbyist;
- worker developing a skill;
- person learning a language;
- person seeking practical knowledge.

There should be no assumption that apprentices are necessarily young.

The terms Mentor and Apprentice describe the relationship rather than age.

## Primary Apprentice Goals

An apprentice wants to:

- identify what they want to learn;
- find an appropriate mentor;
- understand the mentor's experience;
- establish trust;
- identify compatible availability;
- request a session;
- communicate a learning goal;
- learn through live interaction;
- continue with a useful mentor;
- track progress.

---

# 3.14 Apprentice Journey 1 — Registration

```text
Landing Page
     ↓
Register
     ↓
Create Account
     ↓
Choose Role
     ↓
Apprentice
     ↓
Verify Email
     ↓
Apprentice Home
```

The apprentice profile should initially remain lightweight.

Information might include:

- name;
- general location;
- timezone;
- languages.

More information can be collected when necessary.

---

# 3.15 Apprentice Journey 2 — Explore Skills

An apprentice may not know the exact mentor they want.

Discovery should therefore begin with the **skill**, not the person.

```text
What would you like to learn?

Automotive
Languages
Home & Trades
Technology
Business
Cooking
Crafts
...
```

The apprentice selects a category and then a skill.

Example:

```text
Automotive
     ↓
Basic Car Maintenance
```

---

# 3.16 Apprentice Journey 3 — Search for Mentor

### Goal

Find mentors capable of teaching the selected skill.

```text
Skill
     ↓
Matching Mentors
     ↓
Filter
     ↓
Compare
     ↓
View Mentor
```

Initial filters:

- language;
- availability;
- teaching level.

Potential later filters:

- price;
- experience;
- location/timezone;
- ratings.

Search results might show:

```text
David Thompson

32 years automotive experience

English · Spanish

Identity Verified ✓

Available Wednesday

View Profile
```

The MVP should avoid complex algorithmic ranking.

Simple, explainable matching is preferable.

---

# 3.17 Apprentice Journey 4 — Evaluate Mentor

The mentor profile should help answer:

> Is this someone I trust and want to learn from?

The apprentice can review:

- biography;
- skills;
- experience;
- languages;
- teaching levels;
- verification;
- availability;
- hourly rate;
- feedback where available.

The design should emphasize **experience and suitability**, rather than popularity.

---

# 3.18 Apprentice Journey 5 — Request Session

```text
Mentor Profile
      ↓
Choose Skill
      ↓
View Availability
      ↓
Choose Time
      ↓
Choose Duration
      ↓
Describe Learning Goal
      ↓
Request Session
```

Example:

```text
Mentor:
David Thompson

Skill:
Basic Car Maintenance

Wednesday
16:00 – 17:00

What would you like help with?

"I recently bought my first car and want
to understand routine maintenance."

[Request Session]
```

---

# 3.19 Apprentice Journey 6 — Booking Confirmation

The apprentice sees:

```text
Booking requested.

Waiting for David to confirm.

Wednesday
16:00 – 17:00
```

After acceptance:

```text
Session Confirmed ✓

David Thompson

Wednesday
16:00 – 17:00

[Add to Calendar]
```

Essential notifications should also be sent.

---

# 3.20 Apprentice Journey 7 — Attend Session

```text
Upcoming Session
       ↓
Join Session
       ↓
Video / Voice
       ↓
Learn
       ↓
Session Complete
```

The interface should minimize distractions.

The human interaction is the central product experience.

---

# 3.21 Apprentice Journey 8 — Provide Feedback

After the session:

```text
Was this session useful?

Yes / No

Did the mentor explain things clearly?

Very clearly
Clearly
Somewhat
Not clearly

Did you make progress toward your goal?

Yes / Partly / No

Would you work with this mentor again?

Yes / No
```

The feedback system should initially avoid reducing mentors to a highly competitive single numerical rating.

---

# 3.22 Apprentice Journey 9 — Continue Mentorship

If the interaction was successful:

```text
Session Completed
       ↓
Continue with David?
       ↓
Yes
       ↓
Mentorship Relationship
       ↓
Shared Goal
       ↓
Book Next Session
```

The apprentice should then have a dedicated relationship view.

Example:

```text
My Mentorship

David Thompson
Basic Car Maintenance

Goal
Become confident maintaining my car.

Sessions
4 completed

Last session
Checking fluid levels

Next goal
Oil and filter maintenance

[Book Next Session]
```

This journey differentiates the platform from one-off marketplaces.

---

# 3.23 Actor: Administrator

## Description

The Administrator operates the platform during the validation stage.

Because the MVP is initially small, administration does not require extensive automation.

## Administrator Goals

The administrator needs to:

- understand who is using the platform;
- manage users;
- manage mentor activation;
- monitor verification;
- manage skills;
- review proposed skills;
- inspect bookings;
- respond to reports;
- suspend problematic accounts;
- review validation feedback.

---

# 3.24 Administrator Journey — User Management

```text
Admin
  ↓
Users
  ↓
Search User
  ↓
View Account
  ↓
Status / Verification / Activity
```

Available actions:

- activate;
- suspend;
- deactivate;
- review verification status.

---

# 3.25 Administrator Journey — Skill Management

```text
Admin
  ↓
Skills
  ↓
Categories
  ↓
Skills
  ↓
Add / Edit / Disable
```

For proposed skills:

```text
Mentor Suggests Skill
        ↓
Pending Review
        ↓
Admin Reviews
        ↓
Approve / Reject
```

---

# 3.26 Administrator Journey — Reports

For MVP:

```text
User Reports Problem
       ↓
Report Created
       ↓
Admin Reviews
       ↓
Contact Participants if Needed
       ↓
Resolve
```

Possible outcomes:

- no action;
- warning;
- booking cancellation;
- user suspension.

More sophisticated case management can be introduced later.

---

# 3.27 External System Actors

Several external systems support the platform but are not human users.

### Authentication Provider

Firebase Auth or Auth0 handles:

- authentication;
- email verification;
- password recovery;
- authentication tokens.

### Identity Verification Provider

Handles identity-verification checks.

The exact provider should remain undecided until the integration requirements are evaluated.

### Video Provider

Daily, Twilio, Zoom, or another provider supplies remote communication infrastructure.

### Email Provider

Sends transactional notifications.

### Stripe Connect

Stripe Connect becomes an external actor when real payments are introduced in the later validation stage.

---

# 3.28 Core MVP Journey

All individual journeys ultimately combine into one primary end-to-end validation journey.

```text
MENTOR                              APPRENTICE

Register                            Register
   ↓                                  ↓
Verify Identity                     Browse Skills
   ↓                                  ↓
Create Profile                      Select Skill
   ↓                                  ↓
Add Skills                          Search Mentors
   ↓                                  ↓
Add Experience                      View Profile
   ↓                                  ↓
Set Availability  ←────────────── View Availability
                                      ↓
                                 Request Session
                                      │
                     Booking Request ─┘
                           ↓
                      Mentor Reviews
                           ↓
                         Accept
                           ↓
                    Session Confirmed
                           ↓
                 ┌─────────────────────┐
                 │                     │
                 │   VIDEO SESSION     │
                 │                     │
                 └─────────────────────┘
                           ↓
                    Session Complete
                           ↓
                    Mutual Feedback
                           ↓
                 Continue Together?
                           ↓
                          YES
                           ↓
               Mentorship Relationship
                           ↓
                      Shared Goal
                           ↓
                   Book Next Session
                           ↓
                  Recurring Interaction
```

---

# 3.29 Primary Validation Journeys

The first external validation release should prioritize five journeys.

**Journey A — Mentor onboarding**

Can a potential mentor independently register, verify, add skills, describe their experience, set availability, and publish a profile?

**Journey B — Mentor discovery**

Can an apprentice specify a skill and identify a mentor they would realistically consider learning from?

**Journey C — Booking**

Can the apprentice understand availability, communicate their learning need, and successfully request a session?

**Journey D — Human interaction**

Can mentor and apprentice successfully move from the platform into a remote mentoring session without significant confusion?

**Journey E — Continuity**

After one successful session, do mentor and apprentice understand how to continue their relationship, establish a goal, and arrange another session?

These five journeys should take priority over secondary functionality.

---

# 3.30 Journey Success Metrics

The MVP should instrument these journeys so that validation is based on observed behaviour as well as interviews.

Examples include:

| Journey | Initial Measure |
|---|---|
| Mentor registration | Registration completion |
| Mentor onboarding | Profile completion |
| Skills | At least one expertise added |
| Availability | At least one availability window added |
| Discovery | Search-to-profile-view rate |
| Mentor evaluation | Profile-to-booking-request rate |
| Booking | Booking completion rate |
| Session | Session completion rate |
| Feedback | Feedback completion rate |
| Continuity | Repeat booking rate |
| Relationship | Mentorship relationship creation |
| Validation | Would-use-again response |

These are product-validation metrics rather than claims of health or societal impact.

---

# 3.31 UX Principle Across All Journeys

Every journey should follow one overarching principle:

> **The technology should facilitate the relationship rather than become the focus of the relationship.**

This means avoiding unnecessary complexity, excessive forms, opaque algorithms, gamification, and administrative work.

For mentors in particular, the platform should make it easy to express:

**Who I am → What I know → When I am available → Who wants my help → What we are learning together.**

For apprentices, it should make it easy to express:

**What I want to learn → Who can help me → When can we meet → What am I learning → Do I want to continue with this person?**

The success of the MVP therefore depends less on the number of features implemented and more on whether these two journeys feel understandable, trustworthy, and worthwhile.