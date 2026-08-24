# Web (Validation A)

Vite + React + TanStack Router + TanStack Query + minimal shadcn/ui.

## Setup

```bash
cp .env.example .env
# VITE_JWT_SECRET must match apps/api JWT_SECRET
npm run dev -w web
```

## F1

- Stub login (mentor / apprentice / dual) mints HS256 JWT in-browser
- Role switcher for dual users
- Mentor + apprentice home shells with API auth ping
- Components: Button, Input, Label, Select, Card, Badge, Alert, Tabs
