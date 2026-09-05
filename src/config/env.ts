import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
export type AppEnvironment = (typeof ENVIRONMENTS)[number];

type EnvAccount = {
  username: string;
  password: string;
  /** Display name the header shows once signed in, which is not the username. */
  accountName: string;
};

type EnvConfig = {
  baseURL: string;
  apiBaseURL: string;
  account: EnvAccount;
};

function parseEnvName(value: string | undefined): AppEnvironment {
  const env = (value ?? 'dev').toLowerCase();
  if (!ENVIRONMENTS.includes(env as AppEnvironment)) {
    throw new Error(`ENV must be one of ${ENVIRONMENTS.join('|')}, got "${value}"`);
  }
  return env as AppEnvironment;
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

/**
 * URLs and the test account both come from the env config so a run is described
 * by ENV alone. Account fields are optional here and only enforced by the tests
 * that sign in, which lets an environment omit them and supply the account
 * through BP_* variables instead.
 */
function loadEnvConfig(name: AppEnvironment): EnvConfig {
  const file = path.resolve(process.cwd(), 'test-data', name, 'env.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Missing env config "${file}"`);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<EnvConfig>;
  if (!data.baseURL || !data.apiBaseURL) {
    throw new Error(`${file} must include baseURL and apiBaseURL`);
  }
  return {
    baseURL: data.baseURL,
    apiBaseURL: data.apiBaseURL,
    account: {
      username: data.account?.username ?? '',
      password: data.account?.password ?? '',
      accountName: data.account?.accountName ?? '',
    },
  };
}

function overrideOr(value: string | undefined, fallback: string): string {
  return value ? value : fallback;
}

const isCi = process.env.CI === 'true' || process.env.CI === '1';
const name = parseEnvName(process.env.ENV);
const config = loadEnvConfig(name);

export const env = {
  name,
  baseURL: overrideOr(process.env.BASE_URL, config.baseURL),
  apiBaseURL: overrideOr(process.env.API_BASE_URL, config.apiBaseURL),
  username: overrideOr(process.env.BP_USERNAME, config.account.username),
  password: overrideOr(process.env.BP_PASSWORD, config.account.password),
  accountName: overrideOr(process.env.BP_ACCOUNT_NAME, config.account.accountName),
  mobile: process.env.MOBILE === '1' || process.env.MOBILE === 'true',
  isCi,
  // The shared QA account is rate-limited, so cap concurrent logins instead of
  // letting Playwright default to one worker per two CPU cores.
  workers: process.env.WORKERS ? parsePositiveInt(process.env.WORKERS, 4) : isCi ? 2 : 2,
  retries: parsePositiveInt(process.env.RETRIES, isCi ? 2 : 0),
};

export function requireCredentials(): { username: string; password: string } {
  if (!env.username || !env.password) {
    throw new Error(missingAccountField('username and password', 'BP_USERNAME / BP_PASSWORD'));
  }
  return { username: env.username, password: env.password };
}

export function requireAccountName(): string {
  if (!env.accountName) {
    throw new Error(missingAccountField('accountName (the name shown in the header)', 'BP_ACCOUNT_NAME'));
  }
  return env.accountName;
}

function missingAccountField(fields: string, variables: string): string {
  return `Set account.${fields} in test-data/${env.name}/env.json, or override with ${variables}`;
}

export function testDataDir(): string {
  return path.resolve(process.cwd(), 'test-data', env.name);
}
