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
