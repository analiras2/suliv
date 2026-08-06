const LOCAL_TEST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function requireLocalTestDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set explicitly for admin E2E tests.');
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL for admin E2E tests is invalid.');
  }

  const database = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !LOCAL_TEST_HOSTS.has(url.hostname) ||
    (url.port || '5432') !== '54329' ||
    database !== 'suliv_test'
  ) {
    throw new Error(
      'Refusing admin E2E database access: DATABASE_URL must target localhost:54329/suliv_test.',
    );
  }

  return databaseUrl;
}
