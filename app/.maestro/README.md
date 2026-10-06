# Maestro flows

Start the Expo project in a development build or Expo Go, then run:

```bash
maestro test .maestro/
```

The auth flows require test-project JWT/refresh-token pairs supplied as
`MAGIC_LINK_ACCESS_TOKEN`, `MAGIC_LINK_REFRESH_TOKEN`, `OAUTH_ACCESS_TOKEN`, and
`OAUTH_REFRESH_TOKEN`. The task 5 journeys additionally use matching
`PERSISTED_*`, `SIGN_OUT_*`, and `DELETE_*` token pairs. OAuth and session flows
open fixed app callbacks directly, so CI never enters a live provider consent
screen.

The splash/bootstrap/offline-mode flows (`splash-*.yaml`) reuse the
`PERSISTED_*` token pair for their "valid persisted session" launches.
`splash-offline-launch-cached.yaml` additionally depends on the device/runner
supporting Maestro's `setAirplaneMode` action (Android only at time of
writing) and on the earlier steps in that same flow having already primed
`cache:profile-snapshot` via a real `GET /me` call before the offline
relaunch. `splash-offline-no-cache-retry.yaml` exercises the opposite,
blocking case (`splash_offline`/`StateView` with retry): it reuses the
`MAGIC_LINK_*` token pair specifically because that session has never been
through a real `GET /me` fetch, so `cache:profile-snapshot` is empty when the
offline relaunch happens; it also depends on `setAirplaneMode` support.
`splash-cold-launch-offline-no-session.yaml` covers the no-session sibling
case, where the login screen itself (not the splash) renders the blocking
`login_offline_no_session` `StateView`.

The onboarding flows (`onboarding-*.yaml`) require a distinct
`ONBOARDING_ACCESS_TOKEN`/`ONBOARDING_REFRESH_TOKEN` pair for a test-project
user whose profile has an incomplete onboarding (`onboardingCompletedAt`
null), so the app routes to `(onboarding)` on login instead of `(tabs)`.
`onboarding-happy-path.yaml` assumes the backend seed data includes an
approved allergen named "Leite". `onboarding-submit-failure-retry.yaml`
depends on `setAirplaneMode` support like the splash offline flow above.

The feed flows (`feed-*.yaml`) also reuse the `PERSISTED_*` token pair and
assume the Prisma seed script (ADR-002) has run, so `GET /feed` returns a
non-empty catalog for all 3 blocks. `feed-empty-catalog.yaml` is the
exception: it needs a distinct `EMPTY_CATALOG_ACCESS_TOKEN`/
`EMPTY_CATALOG_REFRESH_TOKEN` pair for a test-project user backed by a
database variant seeded with zero approved recipes, so `GET /feed`'s
`catalogEmpty` flag is `true` and the feed renders `state-view-feed_no_relevant_recipes`
instead of the 3 normal blocks.

`search-empty-state.yaml` also asserts the `state-view-search_no_results`
primary action clears filters and returns to a populated result set — it
reuses the `PERSISTED_*` token pair and assumes the Prisma seed script has
seeded at least one recipe once the query is cleared.

`recipe-not-found-state-view.yaml` reuses the `PERSISTED_*` token pair (the
back-to-feed action lands on the authenticated feed) and opens a deep link to
a slug no seed data ever creates, asserting `state-view-recipe_not_found`
renders and its primary action navigates to `(tabs)`.

The guided-cooking flows (`cook-*.yaml`) reuse the `PERSISTED_*` token pair and
assume the Prisma seed script has run, so `panqueca-de-banana-vegana` (4 timed
steps: 120/180/120/360s) is seeded. `cook-full-session-with-timer-and-finalization.yaml`
waits out the first step's real 120s timer via `extendedWaitUntil` rather than
fast-forwarding it, since Maestro has no time-travel capability on a real
device/simulator. `cook-offline-session-previously-cached.yaml` depends on
`setAirplaneMode` support (Android only at time of writing) and warms
`recipe-detail-cache` by opening the recipe detail screen online immediately
before going offline. `cook-abandonment.yaml`'s `guided_cook_abandoned` firing
and the offline flow's post-reconnect event sync are both verified via a
test-only event log or seeded `analytics_events`/`sync_operations` row check,
not a user-visible assertion — that verification step is outside Maestro's
own YAML and must be run separately against the test backend.

`saved-empty-state-and-list-rendering.yaml` asserts the empty favorites list
renders `state-view-favorites_empty` and that its primary action
(`state-view-primary-action`) navigates to the feed.
`my-recipes-empty-state-and-populated.yaml` asserts the same for
`state-view-my_recipes_empty` on "Minhas Receitas".

The favorites flows (`saved-*.yaml`) reuse the `PERSISTED_*` token pair and
assume the Prisma seed script has run, so `panqueca-de-banana-vegana` is
seeded with its "Banana madura" ingredient. They exercise the "Salvos" tab
(unchanged name — this feature is a store-swap, not a rename) and the
recipe-detail screen's `recipe-detail-favorite-button` CTA.
`saved-favorite-online-survives-restart-cooks-offline.yaml` and
`saved-favorite-offline-reconnect-syncs.yaml` depend on `setAirplaneMode`
support (Android only at time of writing); the former also does a real
`stopApp`/`launchApp` restart to prove the favorite survived. Both offline
flows warm `recipe-detail-cache` by opening the recipe online first, since the
favorite CTA needs the full recipe detail already cached to write it offline.
`saved-favorite-offline-reconnect-syncs.yaml`'s `favorite_saved_offline` firing
and the server-side `GET /favorites` reflection after reconnect are verified
via a test-only check against the test backend, not a user-visible assertion,
same pattern as the guided-cooking flows above.

The "Minhas Receitas" flows (`my-recipes-*.yaml`) require a dedicated
`RECIPE_AUTHOR_ACCESS_TOKEN`/`RECIPE_AUTHOR_REFRESH_TOKEN` pair for a
test-project user who authors recipes, distinct from `PERSISTED_*`, so
`my-recipes-offline-create-sync-submit.yaml` and
`my-recipes-empty-state-and-populated.yaml` can rely on "Minhas Receitas"
starting empty. `my-recipes-edit-approved-reenters-moderation.yaml` and
`my-recipes-delete-with-favorites-impact.yaml` additionally assume the Prisma
seed script gives this user two more seeded recipes: an approved "Salada de
quinoa da autora" (at least one step) and an approved "Torta salgada da
autora" favorited by 2 other seeded users.
`my-recipes-offline-create-sync-submit.yaml` depends on `setAirplaneMode`
support (Android only at time of writing), same as the splash/cook/favorites
offline flows. The image-picker steps in `my-recipes-offline-create-sync-submit.yaml`,
`my-recipes-submit-blocked-without-image.yaml`, and
`my-recipes-empty-state-and-populated.yaml` assume the test device/simulator's
photo library has at least one fixture image available to pick, and that a
Cloudinary sandbox/mock is configured per the TechSpec's Testing Approach so
the automatic image upload doesn't hit the real service in CI.
`submitted_recipe_started`/`submitted_recipe_completed` firing, the
post-reconnect sync/upload reflection, the re-moderation recipe's
disappearance from search/feed, and the other seeded users' favorites-list
reflection are all verified via a test-only check against the test backend
(seeded state / event log / request log), not user-visible assertions, same
pattern as the guided-cooking and favorites offline flows' analytics
verification.

`my-recipes-submit-error-retry.yaml` also uses the `RECIPE_AUTHOR_*` token
pair and depends on `setAirplaneMode` support (Android only at time of
writing), same as the splash/onboarding offline flows: it fills out a new
recipe, picks a cover image, goes offline, submits (asserting
`state-view-submit_error` per ADR-003's network/server-only scope, distinct
from `my-recipes-submit-blocked-without-image.yaml`'s validation-gate
message), then reconnects and retries via `state-view-primary-action`,
asserting the same draft content the user entered is still there once the
retry succeeds. The `submit_error` structured log firing is verified via a
test-only check against the test backend/log output, not a user-visible
assertion, same pattern as the analytics-event flows above.
