# Mentor Apprentice

Monorepo: React web app + NestJS API.

## Structure

```
apps/web   # React (Vite + TypeScript)
apps/api   # NestJS
packages/  # shared packages
docs/      # documentation
```

## Setup

```bash
docker compose up -d
cd apps/api && cp .env.example .env
npm install
npm run prisma:deploy -w api
```

Postgres maps to host port **5433** (avoids clash with local Postgres on 5432).
## Develop

```bash
npm run dev:api   # http://localhost:3000
npm run dev:web   # http://localhost:5173
```

### Web (F1 foundation)

Vite + TanStack Router + TanStack Query + minimal shadcn/ui.

```bash
cp apps/web/.env.example apps/web/.env
# VITE_JWT_SECRET must match apps/api JWT_SECRET (stub mode)
```

**Auth modes** (`AUTH_MODE` / `VITE_AUTH_MODE`):

| Mode | Default | Behavior |
|------|---------|----------|
| `stub` | yes | Browser mints HS256 JWT; CI/e2e use this |
| `auth0` | no | Auth0 Universal Login; API verifies RS256 via JWKS |

Stub login at `/login` (persona + display name). Register at `/register` (email + Mentor/Apprentice/both; creates user via JWT + `GET /users/me`). Auth0: `/login` sign-in, `/register` opens Universal Login signup (`screen_hint=signup`), callback `/auth/callback`, role pick `/onboarding/role`.

#### Auth0 setup (optional)

1. Create Auth0 SPA app + API (audience).
2. Allowed callback: `http://localhost:5173/auth/callback`
3. Allowed logout: `http://localhost:5173`
4. Post-Login Action — add email claims to the **access token**:

```js
exports.onExecutePostLogin = async (event, api) => {
  const ns = 'https://mentor-apprentice.local/';
  if (event.authorization) {
    api.accessToken.setCustomClaim(`${ns}email`, event.user.email);
    api.accessToken.setCustomClaim(`${ns}email_verified`, event.user.email_verified);
    api.accessToken.setCustomClaim(`${ns}name`, event.user.name);
  }
};
```

5. API `.env`: `AUTH_MODE=auth0`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`
6. Web `.env`: `VITE_AUTH_MODE=auth0`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`

Roles are stored in the DB (`POST /users/me/roles`) — Auth0 tokens are not trusted for roles. Unverified email blocks publish, booking, and identity verification start.

### Web features (implemented)

UI at `http://localhost:5173`. Routes require the matching role unless noted.

| Area | Routes | What you can do |
|------|--------|-----------------|
| Auth | `/login`, `/register`, `/auth/callback`, `/onboarding/role` | Sign in / create account (stub or Auth0); pick Mentor / Apprentice / both |
| Mentor setup | `/mentor`, `/mentor/profile`, `/mentor/languages`, `/mentor/expertise`, `/mentor/verification`, `/mentor/availability`, `/mentor/publish` | Profile, languages, skills, identity verify (stub), weekly rules + unavailability exceptions, publish/unpublish |
| Mentor ops | `/mentor/bookings`, `/mentor/sessions`, `/mentor/sessions/:id`, `/mentor/mentorships`, `/mentor/mentorships/:id` | Accept/decline/cancel bookings; join/complete/no-show/tech-fail; session summary; continue mentorship, goals, pause/end |
| Apprentice | `/apprentice`, `/apprentice/profile`, `/apprentice/discover`, `/apprentice/discover/:profileId` | Profile; search mentors by skill; view detail + book slots |
| Apprentice ops | `/apprentice/bookings`, `/apprentice/sessions`, `/apprentice/sessions/:id`, `/apprentice/mentorships`, `/apprentice/mentorships/:id` | Request/cancel bookings; join sessions; feedback; mentorship lifecycle |
| Shared safety | `/blocks`, `/reports`, `/notifications`, `/feedback` | Blocked list; own reports; in-app notification inbox + badge; product feedback. Block/report also from session, mentorship, and mentor detail |
| Admin | `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/reports`, `/admin/reports/:id` | Search users; suspend/unsuspend; review + resolve reports (stub persona **Admin**) |

**Not in UI yet:** payments / Stripe, email/session reminders, admin skill-catalogue CRUD.

### Mentor profile (Wave 1)

Authenticated mentor JWT (HS256 stub):

```json
{
  "sub": "auth-provider-id",
  "email": "mentor@example.com",
  "displayName": "David",
  "roles": ["MENTOR"]
}
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/mentors/profile` | Create DRAFT profile |
| GET | `/mentors/me` | Read own profile (includes languages) |
| PATCH | `/mentors/me` | Update own profile |
| PUT | `/mentors/me/languages` | Replace mentor languages |
| POST | `/mentors/me/expertise` | Add skill expertise |
| PATCH | `/mentors/me/expertise/:id` | Update own expertise |
| DELETE | `/mentors/me/expertise/:id` | Remove own expertise |
| GET | `/languages` | List active language catalogue |
| GET | `/skills/categories` | List active skill categories |
| GET | `/skills` | List active skills (`?categoryId=`) |
| GET | `/verifications/me` | Own identity verification status |
| POST | `/verifications/identity` | Start or retry identity verification (MENTOR) |
| POST | `/verifications/identity/stub-result` | Stub provider result (MENTOR; disable with `ALLOW_VERIFICATION_STUB=false`) |
| GET | `/mentors/me/availability` | List own weekly availability rules |
| PUT | `/mentors/me/availability` | Replace all availability rules |
| DELETE | `/mentors/me/availability/:ruleId` | Remove one availability rule |
| GET | `/mentors/me/availability-exceptions` | List unavailability exceptions |
| POST | `/mentors/me/availability-exceptions` | Add unavailability exception |
| DELETE | `/mentors/me/availability-exceptions/:exceptionId` | Remove exception |

Identity verification belongs to **User**, not MentorProfile. Mentors may create and edit a DRAFT profile before verification. `FAILED` / `REQUIRES_REVIEW` are not verified. Publish/bookable gate is Wave 6.

Availability belongs to **MentorProfile**. Each rule stores a timezone (defaults to profile timezone). Overlapping windows on the same day are rejected. `hasAvailability` on `GET /mentors/me` is data only until Wave 6.

| GET | `/mentors/me/publication-eligibility` | Publication readiness checklist |
| POST | `/mentors/me/publish` | Publish profile when eligible (`422` with missing requirements if not) |
| POST | `/mentors/me/unpublish` | Unpublish profile |

`GET /mentors/me` includes `publicationEligibility` and `isBookable`. Only `VERIFIED` identity + active expertise + availability makes a **published** mentor bookable.

### Apprentice + Discovery (Wave 7)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/apprentices/profile` | Create apprentice profile (also ensures APPRENTICE role; dual-role OK) |
| GET | `/apprentices/me` | Read own apprentice profile |
| PATCH | `/apprentices/me` | Update own apprentice profile |
| POST | `/blocks` | Block a user `{ blockedUserId }` |
| DELETE | `/blocks/:blockedUserId` | Unblock |
| GET | `/discovery/mentors?skillId=` | Search bookable mentors (`languageId`, `teachingLevel` optional) |
| GET | `/discovery/mentors/:profileId` | Public mentor detail |
| GET | `/discovery/mentors/:profileId/slots` | Available slots (`from`, `to`, `durationMinutes`) |

Discovery requires APPRENTICE role. Results only include ACTIVE + PUBLISHED + VERIFIED mentors with matching active expertise and availability. Blocked users are excluded. Search and profile views record analytics events (`SKILL_SEARCH`, `MENTOR_PROFILE_VIEW`).

### Booking (Wave 8)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mentors/me/availability-exceptions` | List unavailability exceptions |
| POST | `/mentors/me/availability-exceptions` | Add exception (`date`, optional `startTime`/`endTime`) |
| DELETE | `/mentors/me/availability-exceptions/:exceptionId` | Remove exception |
| POST | `/bookings` | Apprentice requests booking |
| GET | `/bookings/me` | List own bookings (`?upcoming=true\|false`) |
| GET | `/bookings/:id` | Booking detail (participants only) |
| POST | `/bookings/:id/accept` | Mentor accepts (reserves; auto-declines conflicting REQUESTED) |
| POST | `/bookings/:id/decline` | Mentor declines |
| POST | `/bookings/:id/cancel` | Participant cancels REQUESTED/ACCEPTED |

Create body: `{ mentorProfileId, skillId, startAt (ISO UTC), durationMinutes: 15\|30\|60\|90, apprenticeMessage? }`.

`REQUESTED` does not reserve. `ACCEPTED` reserves. Weekly rules + `UNAVAILABLE` exceptions apply on create. Accept creates a Session (`READY`) with stub join URL. No payment or mentorship relationship in this wave. Analytics: `BOOKING_REQUESTED`, `BOOKING_ACCEPTED`, `BOOKING_DECLINED`, `BOOKING_CANCELLED`.

### Session (Wave 9)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions/me` | List own sessions (`?upcoming=true\|false`) |
| GET | `/sessions/:id` | Session detail (participants only) |
| GET | `/bookings/:id/session` | Session for booking |
| POST | `/sessions/:id/join` | Join within configurable window; records attendance |
| POST | `/sessions/:id/complete` | Complete after both attended → Booking `COMPLETED` |
| POST | `/sessions/:id/report-no-show` | No-show → Session `FAILED` + Booking `NO_SHOW` |
| POST | `/sessions/:id/report-technical-failure` | Tech fail → Session `FAILED` + Booking `CANCELLED` |
| PUT | `/sessions/:id/summary` | Mentor upserts shared summary after completion |

Join window via `SESSION_JOIN_OPEN_MINUTES_BEFORE` (default 15) and `SESSION_JOIN_CLOSE_MINUTES_AFTER_END` (default 30). Stub video only. Analytics: `SESSION_JOINED`, `SESSION_COMPLETED`, `SESSION_NO_SHOW`, `SESSION_TECH_FAILURE`, `SESSION_CANCELLED`. No feedback, Stripe, WebRTC, or auto-complete.

### Mentorship (Wave 10)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/:id/continue` | After completed session: create/get ACTIVE relationship |
| GET | `/mentorships/me` | List own relationships (`?status=`) |
| GET | `/mentorships/:id` | Relationship detail (participants; history kept after end) |
| GET | `/mentorships/:id/bookings` | Bookings linked to relationship |
| GET | `/mentorships/:id/sessions` | Sessions under linked bookings |
| POST | `/mentorships/:id/pause\|resume\|complete\|end` | Lifecycle |
| PUT | `/mentorships/:id/goals` | Upsert active shared goal |
| POST | `/mentorships/:id/goals/:goalId/achieve\|cancel` | Goal status |

Continue body optional: `{ title?, description? }`. One ACTIVE relationship per mentor+apprentice+skill. Completed booking gets `relationshipId`. Later same-pair+skill bookings auto-attach only while ACTIVE. Block ends ACTIVE relationships. No feedback/payments.

### Feedback (Wave 11)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/:id/feedback` | Submit session feedback (participants; COMPLETED only) |
| GET | `/sessions/:id/feedback/me` | Own submission for session |
| POST | `/feedback/product` | Platform usability feedback |

Session feedback: one submission per participant. Apprentice fields: useful, clear, progress, book again. Mentor fields: respectful, goal clear, mentor again. Optional comment. `GET /sessions/:id` includes `myFeedbackSubmitted`. Product feedback separate from interpersonal feedback.

### Blocks (trust & safety)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/blocks/me` | List users you blocked |
| POST | `/blocks` | Block user `{ blockedUserId }` |
| DELETE | `/blocks/:blockedUserId` | Unblock |

Block ends ACTIVE mentorships between the pair, cancels open REQUESTED/ACCEPTED bookings (`cancelReason=USER_BLOCKED`), and excludes both sides from discovery. Blocked party is not notified. Discovery mentor detail includes `userId` for block actions.

### Reports (Wave 12)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reports` | Submit user report |
| GET | `/reports/me` | List own submitted reports |

Body: `{ reportedUserId, reason, description, bookingId?, sessionId?, mentorshipId? }`. Reasons: `HARASSMENT`, `INAPPROPRIATE_BEHAVIOR`, `SAFETY_CONCERN`, `SPAM`, `OTHER`. Reports start as `OPEN` and do not auto-suspend the reported user (BR-REPORT-003). Without explicit context ids, reporter must have an existing booking or mentorship with the reported user. One open report per reporter/reported pair. `GET /sessions/:id` includes `mentorUserId` and `apprenticeUserId` for safety actions.

### Notifications (Wave 13)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications/me` | List in-app notifications (`?unreadOnly=true` optional) |
| GET | `/notifications/me/unread-count` | Unread count for badge |
| PATCH | `/notifications/:id/read` | Mark one notification read |
| POST | `/notifications/me/read-all` | Mark all read |

Types: `BOOKING_REQUESTED`, `BOOKING_ACCEPTED`, `BOOKING_DECLINED`, `BOOKING_CANCELLED`, `FEEDBACK_REQUESTED`. Created after successful booking/session actions; notification failures do not roll back domain operations (BR-NOTIFY-005). Block flow does not notify the blocked user (BR-BLOCK-005). Email and session reminders are not in this wave.

### Users / Auth (Wave F11)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Current user + `needsRoleSelection` |
| POST | `/users/me/roles` | Add MENTOR / APPRENTICE roles `{ roles: [...] }` |

`AUTH_MODE=stub` (default): HS256 JWT with roles in claims. `AUTH_MODE=auth0`: JWKS verify; roles only from DB. Email verification required for publish, booking create, and starting identity verification.

### Admin (Wave F12)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users?q=&status=` | List/search users (ADMIN) |
| GET | `/admin/users/:id` | User detail + mentor/verification snapshot |
| POST | `/admin/users/:id/suspend` | Set `UserStatus.SUSPENDED` |
| POST | `/admin/users/:id/unsuspend` | Restore `ACTIVE` |
| GET | `/admin/reports?status=` | List reports |
| GET | `/admin/reports/:id` | Report detail |
| POST | `/admin/reports/:id/resolve` | `{ outcome, note? }` — outcomes: `NO_ACTION`, `WARNING`, `USER_SUSPENDED`, `USER_DEACTIVATED`, `DISMISSED` |

Stub login persona **Admin** mints `ADMIN` role. Auth0: grant `ADMIN` in DB only — `/users/me/roles` cannot self-assign ADMIN. Suspended users already blocked from book/publish/session actions via existing `assertActive` gates; discovery excludes non-ACTIVE mentors.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Vite dev server |
| `npm run dev:api` | NestJS watch mode |
| `npm run build` | Build API + web |
| `npm run lint:check` | Lint without autofix |
| `npm run test -w api` | API unit tests |
| `npm run test:e2e -w api` | API e2e (needs Postgres) |

## CI / CD

GitHub Actions:

- **CI** (`.github/workflows/ci.yml`) — on PR/push: API lint + unit + e2e (Postgres service) + build; web lint + build
- **CD** (`.github/workflows/cd.yml`) — placeholder until deploy host chosen

After pushing to GitHub, open the Actions tab to see CI runs.
