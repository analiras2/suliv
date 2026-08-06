---
provider: manual
pr:
round: 2
round_created_at: 2026-08-06T15:32:56Z
status: resolved
file: scripts/local-test-env.mjs
line: 128
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Test API starts with non-test environment

## Review Comment

`api:start:test` starts Nest with `api/.env.local`, whereas the admin E2E
runner validates and writes its fixture admin to the isolated database from
`admin/.env.test.local` (the same `suliv_test` database expected from
`api/.env.test.local`). As a result, the browser sends its login request to an
API connected to a different database and every admin E2E reports “Invalid
email or password”. The freshly added E2E-004 fails this way too, so it has no
valid end-to-end evidence.

Make the API test-start action load `api/.env.test.local` and keep its database
target under the same local-test safety validation. Then start the API through
that action and rerun the admin Playwright suite against the single isolated
database.

## Triage

- Decision: `VALID`
- Root cause: `api:start:test` is the documented API command for admin E2E,
  but its action loads `api/.env.local` while the API and Playwright fixtures
  must share the isolated URL in `api/.env.test.local`.
- Fix: `api:start:test` now loads `api/.env.test.local`; both test-env
  templates define the same test-only `ADMIN_JWT_SECRET`; and Playwright uses
  `next dev` so the local HTTP server does not reject its session cookie.
- Verification: `npm run test:e2e` completed with 5 passing Playwright tests
  against `localhost:54329/suliv_test`.
