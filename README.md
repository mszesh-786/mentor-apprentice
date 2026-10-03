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
| Apprentice | `/apprentice`, `/apprentice/profile`, `/apprentice/discover`, `/apprentice/discover/:profileId` | Profile; search mentors (text, category chips, filters) in a card grid; mentor page with ratings, reviews, and sticky booking card |
| Apprentice ops | `/apprentice/bookings`, `/apprentice/sessions`, `/apprentice/sessions/:id`, `/apprentice/mentorships`, `/apprentice/mentorships/:id` | Request/cancel bookings; join sessions; feedback with 1–5 star rating; mentorship lifecycle |
| Shared safety | `/blocks`, `/reports`, `/notifications`, `/feedback` | Blocked list; own reports; in-app notification inbox + badge; product feedback. Block/report also from session, mentorship, and mentor detail |
| Admin | `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/reports`, `/admin/reports/:id` | Search users; suspend/unsuspend; review + resolve reports (stub persona **Admin**) |

**Not in UI yet:** payments / Stripe, email/session reminders, admin skill-catalogue CRUD.

**Browser E2E:** Playwright smoke + full happy path (`apps/web/e2e`). CI Playwright job still pending — see Scripts / Playwright below.

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
| GET | `/discovery/mentors` | Search bookable mentors. All filters optional: `q` (name, headline, bio, skill, category), `categoryId`, `skillId`, `languageId`, `teachingLevel`. Max 50 results |
| GET | `/discovery/mentors/:profileId` | Public mentor detail (incl. `averageRating`, `reviewCount`, `completedSessionCount`) |
| GET | `/discovery/mentors/:profileId/reviews` | Apprentice reviews, newest first (`offset`, `limit` ≤ 50). Reviewer first name only |
| GET | `/discovery/mentors/:profileId/slots` | Available slots (`from`, `to`, `durationMinutes`) |

Discovery requires APPRENTICE role. Results only include ACTIVE + PUBLISHED + VERIFIED mentors with matching active expertise and availability. Blocked users are excluded. Cards include `averageRating` (1 decimal, `null` = no reviews), `reviewCount`, `bioExcerpt`, `profilePhotoUrl`. With `skillId` results sort by years of experience; otherwise by review-count-weighted rating. Search with `skillId` and profile views record analytics events (`SKILL_SEARCH`, `MENTOR_PROFILE_VIEW`).

Ratings come from apprentice session feedback: `rating` (1–5) is required on apprentice feedback (`POST /sessions/:id/feedback`); mentor feedback has no rating.

#### Demo data

```bash
npm run prisma:seed -w api   # catalogue first
npm run seed:demo -w api     # 8 demo mentors, 6 apprentices, ~50 reviews
```

Rerunnable: deletes and recreates `demo-*@example.com` users and their bookings/sessions. Refuses to run when `NODE_ENV=production`. Photos load from `i.pravatar.cc`.

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
| `npm run test:e2e:web` | Playwright browser smoke/e2e (needs API + stub auth) |

### Playwright (web)

Stub-auth browser tests under `apps/web/e2e`. Scaffold smoke: register mentor → `/mentor`.

```bash
# Terminal A — API (Postgres up, migrations + seed applied)
npm run dev:api

# Terminal B — Playwright starts Vite itself
npm run test:e2e:web
# or: npm run test:e2e -w web
```

Env (defaults match local stub):

- `VITE_API_URL` / API on `http://127.0.0.1:3000`
- `VITE_JWT_SECRET` = API `JWT_SECRET`
- `VITE_AUTH_MODE=stub`

HTML report: `npm run test:e2e:report -w web`. Specs: smoke register + full happy path.

**API env for join/complete:** wide session window (same as API e2e):

```bash
SESSION_JOIN_OPEN_MINUTES_BEFORE=100000 SESSION_JOIN_CLOSE_MINUTES_AFTER_END=100000 npm run dev:api
```

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`), on PR and push to `main`:

- **API** — lint, unit tests, migrations + seed against a Postgres service, API e2e, build
- **Web** — lint, build
- **Web E2E** — Postgres service, built API in stub mode, Playwright Chromium; report uploaded as an artifact on failure

Deploys come from the hosts' git integrations (no CD workflow):

```
main ─┬─► Vercel  → apps/web  (React SPA)
      └─► Render  → apps/api  (NestJS) ─► Neon Postgres
```

## Staging deploy

### Neon

Create a project and copy both connection strings:

- `DATABASE_URL` — **pooled** (host contains `-pooler`), append `&pgbouncer=true&connect_timeout=15`
- `DIRECT_URL` — **direct** (non-pooled); Prisma uses it for migrations

### Auth0 (staging application)

Single Page Application, with an API whose identifier becomes the audience. Set the
application URLs to the Vercel domain:

- Allowed Callback URLs: `https://<vercel-domain>/auth/callback`
- Allowed Logout URLs / Allowed Web Origins: `https://<vercel-domain>`

### Render (API)

New → Blueprint → this repo; `render.yaml` defines the service. Fill the prompted values:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `CORS_ORIGIN` | `https://<vercel-domain>` (comma-separate extras, e.g. preview domains) |
| `AUTH0_DOMAIN` / `AUTH0_AUDIENCE` | from Auth0 |

The start command runs `prisma migrate deploy` before booting. The API refuses to start
with stub auth when `NODE_ENV=production` (override with `ALLOW_STUB_AUTH=true` only for
private environments). Free instances sleep when idle; the first request takes ~30–60s.

### Vercel (web)

Import the repo, set **Root Directory** to `apps/web` (`vercel.json` handles SPA rewrites).
Environment variables (build-time):

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://<render-service>.onrender.com` |
| `VITE_AUTH_MODE` | `auth0` |
| `VITE_AUTH0_DOMAIN` / `VITE_AUTH0_CLIENT_ID` / `VITE_AUTH0_AUDIENCE` | from Auth0 |

Never set `VITE_JWT_SECRET` on Vercel — it would ship the signing secret to browsers.

### Demo data

After the first successful deploy, seed Neon from your machine (uses the direct URL):

```bash
cd apps/api
DATABASE_URL="<neon-direct-url>" DIRECT_URL="<neon-direct-url>" npm run prisma:seed
DATABASE_URL="<neon-direct-url>" DIRECT_URL="<neon-direct-url>" npm run seed:demo
```
