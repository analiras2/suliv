/* global http, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVOKED_USER_ID */
// Deletes the test user through the local Supabase admin API so the access token the app holds stops
// being accepted by the API. Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and REVOKED_USER_ID.
let response = http.delete(SUPABASE_URL + '/auth/v1/admin/users/' + REVOKED_USER_ID, {
  headers: {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
  },
});

if (!response.ok) {
  throw new Error('Could not delete the test user (status ' + response.status + ')');
}
