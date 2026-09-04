import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
export type AppEnvironment = (typeof ENVIRONMENTS)[number];

const REMOTE_PROVIDERS = ['none', 'selenium', 'browserstack', 'lambdatest'] as const;
export type RemoteProvider = (typeof REMOTE_PROVIDERS)[number];

function parseEnvName(value: string | undefined): AppEnvironment {
  const env = (value ?? 'dev').toLowerCase();
  if (!ENVIRONMENTS.includes(env as AppEnvironment)) {
    throw new Error(`ENV must be one of ${ENVIRONMENTS.join('|')}, got "${value}"`);
  }
  return env as AppEnvironment;
}

function parseRemote(value: string | undefined): RemoteProvider {
  const provider = (value ?? 'none').toLowerCase();
  if (!REMOTE_PROVIDERS.includes(provider as RemoteProvider)) {
    throw new Error(`REMOTE_PROVIDER must be one of ${REMOTE_PROVIDERS.join('|')}`);
  }
  return provider as RemoteProvider;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer, got "${value}"`);
  }
  return parsed;
}

const isCi = process.env.CI === 'true' || process.env.CI === '1';

export const env = {
  name: parseEnvName(process.env.ENV),
  baseURL: process.env.BASE_URL ?? 'https://www.brainpop.com/login/',
  apiBaseURL: process.env.API_BASE_URL ?? 'https://api.brainpop.com',
  username: process.env.BP_USERNAME ?? '',
  password: process.env.BP_PASSWORD ?? '',
  mobile: process.env.MOBILE === '1' || process.env.MOBILE === 'true',
  remoteProvider: parseRemote(process.env.REMOTE_PROVIDER),
  remoteWsEndpoint: process.env.REMOTE_WS_ENDPOINT,
  browserstackUsername: process.env.BROWSERSTACK_USERNAME,
  browserstackAccessKey: process.env.BROWSERSTACK_ACCESS_KEY,
  lambdatestUsername: process.env.LAMBDATEST_USERNAME,
  lambdatestAccessKey: process.env.LAMBDATEST_ACCESS_KEY,
  perfLighthouse: process.env.PERF_LIGHTHOUSE === '1',
  isCi,
  // The shared QA account is rate-limited, so cap concurrent logins instead of
  // letting Playwright default to one worker per two CPU cores.
  workers: process.env.WORKERS ? parsePositiveInt(process.env.WORKERS, 4) : isCi ? 2 : 4,
  retries: parsePositiveInt(process.env.RETRIES, isCi ? 2 : 0),
};

export function requireCredentials(): { username: string; password: string } {
  if (!env.username || !env.password) {
    throw new Error('BP_USERNAME and BP_PASSWORD must be set (copy .env.example to .env)');
  }
  return { username: env.username, password: env.password };
}

export function testDataDir(): string {
  return path.resolve(process.cwd(), 'test-data', env.name);
}

export function ensureTestDataDir(): void {
  if (!fs.existsSync(testDataDir())) {
    throw new Error(`Missing test-data directory for ENV=${env.name}: ${testDataDir()}`);
  }
}
