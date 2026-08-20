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

Identity verification belongs to **User**, not MentorProfile. Mentors may create and edit a DRAFT profile before verification. `FAILED` / `REQUIRES_REVIEW` are not verified. Publish/bookable gate is Wave 6.

Availability belongs to **MentorProfile**. Each rule stores a timezone (defaults to profile timezone). Overlapping windows on the same day are rejected. `hasAvailability` on `GET /mentors/me` is data only until Wave 6.

| GET | `/mentors/me/publication-eligibility` | Publication readiness checklist |
| POST | `/mentors/me/publish` | Publish profile when eligible (`422` with missing requirements if not) |
| POST | `/mentors/me/unpublish` | Unpublish profile |

`GET /mentors/me` includes `publicationEligibility` and `isBookable`. Only `VERIFIED` identity + active expertise + availability makes a **published** mentor bookable. No discovery or booking in this wave.

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
