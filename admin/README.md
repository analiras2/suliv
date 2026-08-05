# Suliv Admin

Moderation panel for the Suliv recipe app — a standalone Next.js (App Router) project, independent of `app/`'s Expo tooling and `api/`'s NestJS backend.

## Install

```bash
npm install
```

Copy `.env.example` to `.env.local` and point `ADMIN_API_URL` at a running instance of `api/` (Task 1's `POST /admin/auth/login`).

## Run

```bash
npm run dev   # http://localhost:3100
```

## Test

```bash
npm run test       # Jest + React Testing Library
npm run test:e2e   # Playwright — requires api/ running against a migrated, reachable Postgres database
```
