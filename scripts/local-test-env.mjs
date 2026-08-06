import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_TEST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCAL_TEST_PORT = '54329';
const LOCAL_TEST_DATABASE = 'suliv_test';

function loadEnvFile(relativePath) {
  const absolutePath = join(repositoryRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Missing ${relativePath}. Copy its .example file before running local test commands.`,
    );
  }

  const values = {};
  for (const rawLine of readFileSync(absolutePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) throw new Error(`Invalid line in ${relativePath}.`);
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function assertLocalTestDatabase(databaseUrl) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required in the local test env file.');

  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL in the local test env file is not a valid URL.');
  }

  const database = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !LOCAL_TEST_HOSTS.has(url.hostname) ||
    (url.port || '5432') !== LOCAL_TEST_PORT ||
    database !== LOCAL_TEST_DATABASE
  ) {
    throw new Error(
      `Refusing database operation. DATABASE_URL must target postgresql://localhost:${LOCAL_TEST_PORT}/${LOCAL_TEST_DATABASE}.`,
    );
  }

  return { host: url.hostname, port: url.port || '5432', database };
}

function assertLocalApiUrl(apiUrl) {
  if (!apiUrl) throw new Error('ADMIN_API_URL is required in admin/.env.test.local.');
  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    throw new Error('ADMIN_API_URL in admin/.env.test.local is not a valid URL.');
  }
  if (url.protocol !== 'http:' || !LOCAL_TEST_HOSTS.has(url.hostname) || (url.port || '80') !== '3000') {
    throw new Error('Refusing E2E run. ADMIN_API_URL must target http://localhost:3000.');
  }
}

function run(command, args, env, project) {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    cwd: join(repositoryRoot, project),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function binary(project, command) {
  return join(repositoryRoot, project, 'node_modules', '.bin', command);
}

const action = process.argv[2];
const actions = {
  'api:migrate': {
    envFile: 'api/.env.test.local',
    project: 'api',
    command: binary('api', 'prisma'),
    args: ['migrate', 'deploy'],
  },
  'api:seed': {
    envFile: 'api/.env.test.local',
    project: 'api',
    command: binary('api', 'prisma'),
    args: ['db', 'seed'],
  },
  'api:integration': {
    envFile: 'api/.env.test.local',
    project: 'api',
    command: binary('api', 'prisma'),
    args: ['migrate', 'reset', '--force'],
    after: {
      command: binary('api', 'jest'),
      args: ['--config', './test/jest-integration.json', '--runInBand'],
    },
  },
  'api:integration:smoke': {
    envFile: 'api/.env.test.local',
    project: 'api',
    command: binary('api', 'jest'),
    args: [
      '--config',
      './test/jest-integration.json',
      '--runInBand',
      'test/recipes.integration-spec.ts',
    ],
  },
  'api:start:test': {
    envFile: 'api/.env.test.local',
    project: 'api',
    command: binary('api', 'nest'),
    args: ['start', '--watch'],
  },
  'admin:e2e': {
    envFile: 'admin/.env.test.local',
    project: 'admin',
    command: binary('admin', 'playwright'),
    args: ['test'],
    requireLocalApi: true,
  },
};

try {
  const selected = actions[action];
  if (!selected) throw new Error(`Unknown local test action: ${basename(action ?? '')}.`);
  const env = loadEnvFile(selected.envFile);
  const target = assertLocalTestDatabase(env.DATABASE_URL);
  if (selected.requireLocalApi) assertLocalApiUrl(env.ADMIN_API_URL);
  console.log(`Using isolated local database ${target.host}:${target.port}/${target.database}.`);
  run(selected.command, selected.args, env, selected.project);
  if (process.exitCode === 0 && selected.after) {
    run(selected.after.command, selected.after.args, env, selected.project);
  }
} catch (error) {
  console.error(`Local test safety check failed: ${error.message}`);
  process.exitCode = 1;
}
