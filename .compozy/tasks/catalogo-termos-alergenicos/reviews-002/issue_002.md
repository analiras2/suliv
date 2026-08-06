---
provider: manual
pr:
round: 2
round_created_at: 2026-08-06T15:32:56Z
status: resolved
file: admin/e2e/allergen-term-management.spec.ts
line: 37
severity: medium
author: claude-code
provider_ref:
---

# Issue 002: E2E-004 does not verify pending-queue behavior

## Review Comment

The test contract requires the pending-allergen queue to continue working
alongside catalog term management. This test creates only an approved allergen
and ends by asserting the static empty-state text `No pending allergen terms.`.
It never creates a pending allergen or uses the queue’s approve/reject
operation, so a regression that breaks pending-term moderation would still
pass E2E-004.

Create a pending allergen fixture in this scenario and approve or reject it
through the visible queue, asserting that the row is refreshed/removed. Scope
the term-editor locators to the newly created approved allergen so the journey
remains deterministic when the test database contains multiple approved
allergens.

## Triage

- Decision: `VALID`
- Root cause: E2E-004 creates only an approved allergen and asserts an empty
  pending-list message, so it does not exercise either pending moderation
  action and uses unscoped controls that become ambiguous with multiple rows.
- Fix: E2E-004 now creates a pending allergen, approves it through its row,
  and verifies that the row disappears. Catalog locators are scoped to the
  approved allergen fixture. The admin client also requests `no-store`, so
  React Query invalidation receives refreshed catalog data after mutations.
- Verification: `npm run test:e2e` completed with 5 passing Playwright tests.
