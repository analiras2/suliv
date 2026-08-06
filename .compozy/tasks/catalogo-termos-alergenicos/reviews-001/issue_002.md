---
provider: manual
pr:
round: 1
round_created_at: 2026-08-06T04:07:38Z
status: resolved
file: api/src/allergen-classification/allergen-classification.service.ts
line: 12
severity: high
author: claude-code
provider_ref:
---

# Issue 002: Normalizer misses required punctuation equivalence

## Review Comment

The PRD requires deterministic classification to treat equivalent punctuation,
spacing, case, and diacritics consistently. `normalizeIngredientName` handles
only diacritics, trimming, case, and whitespace; punctuation is retained.
Thus a catalog term such as `Leite` does not match an ingredient written as
`Leite,`, producing a silent false negative and withholding the allergy
warning. It also returns punctuation-only input unchanged, despite the
TechSpec requiring it to be non-matching.

Define and apply one punctuation canonicalization policy in the shared
normalizer, then add unit cases for equivalent punctuation and punctuation-only
input. Keep the exact full-expression rule by canonicalizing both catalog terms
and ingredient names before the equality lookup, rather than adding substring
matching.

## Triage

- Decision: `VALID`
- Root cause: `normalizeIngredientName` in
  `api/src/allergen-classification/allergen-classification.service.ts` only
  stripped diacritics, trimmed, lowercased, and collapsed whitespace. It never
  removed punctuation, so `Leite` and `Leite,` normalized to different strings
  (`leite` vs `leite,`), causing the exact-match lookup in `detectAllergenIds`
  to silently miss a valid allergen match. Punctuation-only input (e.g. `...`
  or `-`) also survived normalization unchanged instead of collapsing to an
  empty string, so it was not filtered out by the `length > 0` guard as the
  TechSpec requires.
- Fix: added a `PUNCTUATION_PATTERN` (`/[\p{P}\p{S}]/gu`) step to
  `normalizeIngredientName` that replaces punctuation/symbol characters with a
  space before whitespace collapsing. This canonicalizes punctuation
  consistently for both catalog terms (stored via
  `AdminAllergensService.assertMeaningfulTerm`, which calls the same
  `normalizeIngredientName`) and ingredient names passed to
  `detectAllergenIds`, preserving the exact full-expression equality lookup
  (no substring matching added). Punctuation-only input now normalizes to an
  empty string and is filtered out by the existing
  `.filter((name) => name.length > 0)` check.
- Tests added in `allergen-classification.service.spec.ts`: UT-009/UT-010
  cover normalizer punctuation equivalence and punctuation-only-to-empty
  behavior; UT-011/UT-012 cover `detectAllergenIds` matching `Leite,` against
  the `leite` catalog term and filtering out punctuation-only names before
  the database lookup.
