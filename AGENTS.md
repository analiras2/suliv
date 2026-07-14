# Suliv

## Project Structure

- `app/` — the React Native (Expo) application. All product code lives here.
- `api/` — the backend API (NestJS), using Supabase (Postgres) as the database.
- `docs/` — project documentation.
- `.claude/rules/` — always-applied rules for this codebase (see below).
- `.claude/skills/` — symlinked skills available to the agent (see below).

## `app/` — React Native (Expo)

Stack: Expo SDK ~57, Expo Router, React 19, React Native 0.86.

Before writing any code, read the versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ — see `app/AGENTS.md`.

### Install dependencies

```bash
cd app
npm install
```

### Run the project

```bash
cd app
npm start        # expo start
npm run android  # expo start --android
npm run ios      # expo start --ios
npm run web      # expo start --web
```

### Lint

```bash
cd app
npm run lint
```

## `api/` — Backend API (NestJS)

Stack: NestJS 11, Prisma (Postgres) as ORM, Supabase as the database/backend, Passport JWT for auth.

### Install dependencies

```bash
cd api
npm install
```

### Run the project

```bash
cd api
npm run start:dev   # nest start --watch
npm run start:debug # nest start --debug --watch
npm run start:prod  # node dist/main
```

### Lint

```bash
cd api
npm run lint
```

### Test

```bash
cd api
npm run test          # unit tests
npm run test:e2e      # end-to-end tests
npm run test:integration  # resets DB via Prisma and runs integration tests
```

### Prisma

```bash
cd api
npm run prisma:generate # generate Prisma client
npm run prisma:migrate  # run dev migrations
npm run prisma:validate # validate schema
```

## Rules (`.claude/rules/`)

- [code-standards.md](.claude/rules/code-standards.md) — code style rules applying to all code in `app/` (e.g. write all code in English).
- [rn-expo.md](.claude/rules/rn-expo.md) — React Native & Expo rules covering native vs. JS boundaries, architecture, and generation/debugging conventions.

## Skills (`.claude/skills/`)

- [compozy](.claude/skills/compozy) — explains Compozy capabilities, CLI commands, workflow pipeline, and configuration.
- [cy-create-prd](.claude/skills/cy-create-prd) — creates a PRD plus its user-story catalog through interactive brainstorming.
- [cy-create-techspec](.claude/skills/cy-create-techspec) — creates a Technical Specification plus its test contract from a PRD.
- [cy-create-tasks](.claude/skills/cy-create-tasks) — decomposes PRDs/TechSpecs into independently implementable task files.
- [cy-execute-task](.claude/skills/cy-execute-task) — executes one PRD task end-to-end (implement, validate, update tracking).
- [cy-review-round](.claude/skills/cy-review-round) — performs a comprehensive code review of a PRD implementation.
- [cy-fix-reviews](.claude/skills/cy-fix-reviews) — resolves batched PR review issues from a review round.
- [cy-final-verify](.claude/skills/cy-final-verify) — enforces fresh verification evidence before completion/commit claims.
- [cy-workflow-memory](.claude/skills/cy-workflow-memory) — maintains workflow-scoped task memory across Compozy runs.
- [git-rebase](.claude/skills/git-rebase) — resolves Git merge/rebase conflicts conservatively.
