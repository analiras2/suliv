---
provider: manual
pr:
round: 1
round_created_at: 2026-08-06T04:07:38Z
status: resolved
file: admin/src/app/(dashboard)/allergens/allergens-queue.tsx
line: 3
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Admin panel has no approved-allergen term editor

## Review Comment

Task 3 requires the existing queue to expose approved allergens and let an
operator add, edit, and delete their ingredient terms, refreshing the list
after every mutation and directing the operator to the explicit backfill.
This component still imports only the pending-queue operations and renders
only approve/reject controls. `admin/src/lib/api-client.ts` and
`admin/src/lib/types.ts` likewise have no approved-catalog or term-mutation
client surface, and there is no Playwright implementation of E2E-004.
Consequently, the newly added backend CRUD is not usable by the content
operator, leaving the catalog non-maintainable from the required panel.

Extend this page with an accessible approved-allergen term editor; add the
corresponding typed API client operations and query invalidation; keep the
pending queue available; show the documented explicit-backfill guidance; and
add the assigned Playwright journey covering create, update, delete, refresh,
and pending-queue preservation.

## Triage

- Decision: `VALID`
- Root cause: The backend CRUD for approved-allergen ingredient terms (`admin-allergens.controller.ts`, `.service.ts`, DTOs) was implemented, but the panel (`allergens-queue.tsx`) still only imports the pending-queue operations (`fetchAllergens`, `approveAllergen`, `rejectAllergen`) and renders only approve/reject controls. `admin/src/lib/api-client.ts` has no client functions for listing approved allergens or creating/updating/deleting their terms, and `admin/src/lib/types.ts` has no `AllergenIngredientTerm` type. There is no Playwright spec covering E2E-004.
- Fix approach:
  1. Add `AllergenIngredientTerm` type and extend `Allergen` with optional `ingredientTerms` in `admin/src/lib/types.ts`.
  2. Add `fetchApprovedAllergens`, `createAllergenTerm`, `updateAllergenTerm`, `deleteAllergenTerm` client functions in `admin/src/lib/api-client.ts`, mirroring the existing `request<T>` helper pattern.
  3. Extend `allergens-queue.tsx` with an `ApprovedAllergensEditor` section: lists approved allergens with their terms, supports add/edit/delete per term with a form, invalidates the approved-allergens query on every successful mutation, keeps the existing pending queue untouched, and shows guidance to run `npm run allergens:backfill` for historical reclassification.
  4. Add `admin/e2e/allergen-term-management.spec.ts` implementing E2E-004 (sign in, open an approved allergen, add/edit/delete a term, verify refresh, verify pending queue still works), following the existing `report-reopen.spec.ts` / `recipe-approve.spec.ts` patterns and using a new `createApprovedAllergen` fixture helper in `admin/e2e/fixtures.ts`.
  - Note: `<batch_scope>` code files list only `allergens-queue.tsx`, but this fix cannot be complete without the typed client surface it depends on and the assigned E2E coverage explicitly required by the issue. Per the fix-reviews workflow, touching `admin/src/lib/api-client.ts`, `admin/src/lib/types.ts`, `admin/e2e/fixtures.ts`, and adding `admin/e2e/allergen-term-management.spec.ts` is the minimum necessary to close this issue, since the component cannot call untyped/nonexistent API functions and the review explicitly calls out the missing Playwright journey.
- Environment note (pre-existing, unrelated to this fix): running the new `allergen-term-management.spec.ts` against the local Docker test stack (`docker-compose.test.yml`) surfaces two pre-existing infra defects that already break every other spec in `admin/e2e/` the same way, confirmed by running `login.spec.ts`, `recipe-approve.spec.ts`, `recipe-adjustment.spec.ts`, and `report-reopen.spec.ts` unmodified against the same stack:
  1. `admin/e2e/fixtures.ts`'s existing raw-SQL helpers (`createAuthor`, `createRecipe`, `createReport`) omit `updated_at`, which has no DB-level default (Prisma's `@updatedAt` is client-side only) — every helper that doesn't set it explicitly hits a NOT NULL violation. Worked around this for the new `createApprovedAllergen` helper by setting `created_at`/`updated_at` explicitly in its own INSERT; left the other pre-existing helpers untouched since they are out of this batch's scope.
  2. `admin/src/app/api/auth/login/route.ts` sets the session cookie with `secure: process.env.NODE_ENV === 'production'`, and Playwright's `webServer` runs the admin app via `npm run build && npm run start` (production mode) over plain `http://localhost:3100`. The browser drops the `Secure` cookie over HTTP, so `loginAsAdmin` never reaches `/recipes` — this reproduces identically on unmodified `login.spec.ts` and blocks the entire local E2E suite, not just this change.
  - Because of (2), `allergen-term-management.spec.ts` could not be executed to a green result in this environment. Verified everything up to and including a successful `POST /api/auth/login` (200, correct JWT, cookie set) and confirmed the component/query logic against the API contract; typecheck (`tsc --noEmit`), `next build`, `eslint`, and `jest` all pass. Recommend a follow-up ticket to fix the login-route cookie `secure` flag (or the E2E `webServer` mode) so the full Playwright suite is runnable locally.
- Status: resolved after implementation and verification below.
