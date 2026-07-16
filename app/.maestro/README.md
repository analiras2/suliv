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
relaunch.

The onboarding flows (`onboarding-*.yaml`) require a distinct
`ONBOARDING_ACCESS_TOKEN`/`ONBOARDING_REFRESH_TOKEN` pair for a test-project
user whose profile has an incomplete onboarding (`onboardingCompletedAt`
null), so the app routes to `(onboarding)` on login instead of `(tabs)`.
`onboarding-happy-path.yaml` assumes the backend seed data includes an
approved allergen named "Leite". `onboarding-submit-failure-retry.yaml`
depends on `setAirplaneMode` support like the splash offline flow above.

The feed flows (`feed-*.yaml`) also reuse the `PERSISTED_*` token pair and
assume the Prisma seed script (ADR-002) has run, so `GET /feed` returns a
non-empty catalog for all 3 blocks.
