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
| GET | `/languages` | List active language catalogue |

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
