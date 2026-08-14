## 02 — MVP Scope

### 2.1 MVP Objective

The purpose of the first MVP is to create a functional Mentor–Apprentice platform that can be shared with potential mentors and apprentices for product validation and usability testing.

The MVP is not intended to provide every capability required for a production-scale global marketplace. Instead, it should enable users to experience the central proposition:

> An experienced person can register as a mentor, describe the skills they can teach, specify when they are available, and be discovered by an apprentice who wants to learn that skill.

The MVP should support a complete but deliberately simple journey from registration through mentor discovery, booking, interaction, and continuation of the mentorship relationship.

### 2.2 User Roles

The MVP supports three roles.

**Mentor**

A mentor is a person who wants to share knowledge or experience.

A mentor can:

- register and sign in;
- create and update a profile;
- complete basic identity verification;
- select skills from the platform skill catalogue;
- add information about their experience for each skill;
- propose a new skill if it does not already exist;
- specify languages spoken;
- specify location/time zone;
- set an hourly rate;
- create and update availability;
- receive booking requests;
- accept or decline booking requests;
- view upcoming sessions;
- view previous sessions;
- participate in a remote mentoring session;
- maintain an ongoing relationship with an apprentice;
- view and update shared learning goals;
- provide post-session feedback.

**Apprentice**

An apprentice is a person seeking to learn a skill from an experienced mentor.

An apprentice can:

- register and sign in;
- create and update a basic profile;
- complete basic identity verification;
- browse available skills;
- search for mentors by skill;
- filter mentors by language and availability;
- view mentor profiles;
- view mentor experience and skills;
- view mentor availability;
- request/book a mentoring session;
- view upcoming and previous sessions;
- participate in a remote mentoring session;
- continue working with the same mentor;
- create or participate in shared learning goals;
- provide post-session feedback.

**Administrator**

For the MVP, administration should remain deliberately simple.

The administrator can:

- view users;
- activate, suspend, or deactivate accounts;
- review mentor verification status;
- manage the skill catalogue;
- approve/reject newly proposed skills;
- view bookings;
- view reports or feedback.

A sophisticated administration portal is not required for initial validation. Some administrative operations may initially be performed manually.

### 2.3 Registration and Authentication

Both mentors and apprentices must be able to create accounts.

During registration, users select their initial role:

- Mentor
- Apprentice

The underlying account model should allow the architecture to support a user becoming both a mentor and an apprentice later, even if the first MVP interface does not emphasize this capability.

Authentication should use an external identity provider rather than implementing passwords and account security internally.

### 2.4 Identity Verification

Identity verification should be required before a user can participate in a mentoring session.

For validation, the verification process should remain lightweight.

The system should distinguish between:

**Identity verification**

Confirms that the person is who they claim to be.

and

**Credential verification**

Confirms professional qualifications or certifications.

Credential verification is outside the initial MVP unless required for a particular validation scenario.

The interface should clearly distinguish:

> Identity Verified

from claims such as:

> Qualified Electrician

The former does not imply the latter.

### 2.5 Skill Catalogue

The platform maintains a structured pool of skills.

Example:

Automotive  
→ Basic Car Maintenance  
→ Engine Maintenance

Languages  
→ English Conversation  
→ German Conversation

Home & Trades  
→ Plumbing Basics  
→ Carpentry

Technology  
→ Computer Basics  
→ Programming

Business  
→ Accounting  
→ Entrepreneurship

Mentors select skills from this catalogue rather than entering every skill as uncontrolled free text.

For each selected skill, a mentor can provide:

- years of experience;
- experience description;
- level they are comfortable teaching;
- optional supporting information.

Mentors can add, update, and remove skills from their profiles.

If a required skill does not exist, the mentor can propose a new skill. For the MVP, the administrator can manually approve proposed skills.

### 2.6 Mentor Profile

A mentor profile should contain enough information for an apprentice to make a meaningful decision.

At minimum:

- name;
- profile photograph;
- short biography;
- general location;
- time zone;
- languages;
- skills;
- experience descriptions;
- years of experience;
- teaching level;
- identity-verification status;
- availability;
- hourly rate, if payments are enabled;
- introductory message.

The system should not expose precise home addresses.

### 2.7 Mentor Availability

Mentors can define when they are available for mentoring.

The MVP should support recurring weekly availability.

For example:

Monday: 10:00–13:00  
Wednesday: 14:00–18:00  
Saturday: 09:00–12:00

Mentors should also be able to block specific dates or temporarily make themselves unavailable.

The system stores time consistently and displays availability according to the user's local time zone.

### 2.8 Mentor Discovery

Apprentices should be able to browse the skill catalogue and search for mentors who offer a particular skill.

The primary discovery journey is:

Skill
→ Matching Mentors
→ Mentor Profile
→ Available Times
→ Request Session

Initial filters should be limited to those useful for validation:

- skill;
- language;
- availability;
- teaching level.

Complex recommendation algorithms are not required.

The first MVP should favour understandable filtering and ranking over machine-learning-based recommendations.

### 2.9 Booking

An apprentice selects:

- mentor;
- skill;
- date;
- available time;
- session duration;
- optional message describing what they want to learn.

The mentor receives the request and can accept or decline it.

A booking therefore follows a simple lifecycle:

Requested
→ Accepted
→ Confirmed
→ Completed

Alternative outcomes include:

Declined  
Cancelled  
No-show

Complex cancellation and dispute policies are not necessary for the first validation release.

### 2.10 Mentoring Session

The MVP should support remote human-to-human interaction.

A confirmed booking provides both participants with access to the mentoring session.

For initial validation, the platform does not necessarily need to build video infrastructure itself. It may integrate an external video provider or securely associate an external meeting link with the booking.

The important validation question is the mentoring experience, not whether the project has built its own video technology.

### 2.11 Mentorship Relationship

The system should distinguish between an individual session and an ongoing mentorship relationship.

After an initial interaction, the mentor and apprentice should be able to continue working together.

A mentorship relationship contains:

- mentor;
- apprentice;
- skill;
- relationship status;
- start date;
- shared learning goal;
- session history;
- basic progress notes.

For example:

Mentor: David  
Apprentice: Priya  
Skill: Basic Car Maintenance  
Goal: Become confident performing routine vehicle maintenance  
Sessions completed: 4

This is an important differentiator from one-off gig marketplaces and should therefore be included even in the validation MVP.

### 2.12 Learning Goals

An apprentice should be able to specify what they want to learn.

For example:

> "I want to learn how to service my own bicycle."

The mentor and apprentice can maintain a simple shared goal associated with their mentorship.

The MVP does not require sophisticated learning-management functionality, courses, exams, certificates, or curriculum generation.

### 2.13 Feedback

After a completed session, both participants should be invited to provide lightweight feedback.

Rather than relying solely on star ratings, initial questions should focus on the interaction.

For apprentices:

- Was the session useful?
- Did the mentor explain the topic clearly?
- Did you make progress toward your goal?
- Would you book this mentor again?

For mentors:

- Was the apprentice respectful?
- Was the learning goal clear?
- Would you mentor this apprentice again?

This feedback is useful both for product validation and future research.

### 2.14 Validation Feedback

Because the purpose of this release is validation, the platform should include an obvious mechanism for users to provide feedback about the product itself.

Examples include:

- What was confusing?
- What was difficult?
- What did you expect but could not find?
- Would you use this platform?
- Would you recommend it?
- What would prevent you from using it?

Feedback should be distinguishable from mentor/apprentice feedback.

### 2.15 Basic Notifications

The MVP should support essential email and in-app notifications for:

- registration;
- booking request;
- booking accepted/declined;
- booking cancelled;
- upcoming-session reminder;
- session completed.

SMS, WhatsApp, and mobile push notifications are outside the initial scope.

### 2.16 Payments

Payments should be designed into the architecture but should not block initial concept validation.

There should therefore be two possible validation stages.

**Validation Release A**

Booking and mentoring operate without real-money movement. The interface can display a mentor's intended hourly rate, but sessions are treated as test sessions.

This allows validation of the core concept without immediately introducing marketplace-payment complexity.

**Validation Release B**

Once there is evidence that mentors and apprentices want to use the service, Stripe Connect can be introduced for real marketplace payments and mentor payouts.

This approach reduces the engineering, regulatory, refund, dispute, and onboarding work required before the central idea has been validated.

### 2.17 Basic Trust and Safety

Even a validation system should provide:

- identity-verification status;
- block user;
- report user;
- cancel session;
- administrator suspension;
- basic community guidelines.

A complete trust-and-safety operation is outside the MVP, but basic safeguards should exist before testing with people outside the development team.

### 2.18 Accessibility

Because older adults are a primary user population, accessibility is part of the MVP rather than a later enhancement.

The interface should prioritize:

- readable typography;
- high contrast;
- large interaction targets;
- straightforward navigation;
- clear terminology;
- simple forms;
- keyboard accessibility;
- understandable validation messages;
- minimal unnecessary steps;
- WCAG 2.2 AA as the design target.

Older adults should be involved in usability validation as early as possible.

### 2.19 MVP Validation Journey

The most important end-to-end scenario for the MVP is:

Mentor registers  
→ verifies identity  
→ creates profile  
→ selects skills  
→ describes experience  
→ specifies language  
→ sets availability  
→ profile becomes discoverable

Apprentice registers  
→ searches for a skill  
→ finds suitable mentors  
→ views a mentor  
→ examines expertise and availability  
→ requests a session

Mentor accepts  
→ session is confirmed  
→ mentor and apprentice meet remotely  
→ session is completed  
→ both provide feedback  
→ apprentice chooses to continue  
→ mentorship relationship develops  
→ another session is booked

If this complete journey works reliably, the MVP is sufficient to begin meaningful validation.

### 2.20 Explicitly Outside the Initial MVP

The following should not be built before initial validation:

- native iOS/Android applications;
- AI mentors;
- AI-generated teaching;
- machine-learning matching;
- automatic translation;
- group mentoring;
- course marketplace;
- certificates;
- complex professional credential verification;
- subscriptions;
- bidding between mentors;
- dynamic pricing;
- sophisticated reputation algorithms;
- public social feeds;
- gamification;
- advanced analytics dashboards;
- custom video infrastructure;
- physical/in-person task marketplace;
- international tax automation.

These capabilities can be considered after the core mentor–apprentice proposition has been validated.

### 2.21 MVP Success Criteria

The MVP should not initially be judged by revenue or user scale.

Its purpose is to answer whether the concept deserves further development.

Key validation questions are:

**Mentors**
- Can older adults successfully create a profile?
- Can they describe their expertise comfortably?
- Do they understand availability and booking?
- Are they interested in sharing their expertise through the platform?
- Would they participate repeatedly?

**Apprentices**
- Can users find an appropriate mentor?
- Do mentor profiles provide enough information to establish trust?
- Are users comfortable requesting a session?
- Do they see value in learning directly from an experienced older person?
- Would they return to the same mentor?

**Relationship**
- Do users want repeat sessions?
- Do meaningful mentor–apprentice relationships begin to form?
- Are shared goals useful?

**Product**
- Where do users become confused?
- Which features are unnecessary?
- What important functionality is missing?
- What prevents users from completing the journey?

The MVP will be considered successful if it enables the complete mentor–apprentice journey and provides sufficient evidence to determine whether the concept should proceed to a production-oriented marketplace.