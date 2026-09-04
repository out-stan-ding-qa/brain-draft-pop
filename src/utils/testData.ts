import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { env, testDataDir } from '../config/env';

export type LoginTestData = {
  invalidUsername: string;
  wrongPassword: string;
  loginErrorPattern: string;
};

export type ApiTestData = {
  successStatus: number;
  successCode: number;
  successMessage: string;
  failureStatus: number;
  failureCode: number;
  failureMessage: string;
};

export type PerformanceBudget = {
  ttfbMs?: number;
  domContentLoadedMs?: number;
  loadCompleteMs?: number;
  firstContentfulPaintMs?: number;
};

export type AppTestData = {
  env: string;
  login: LoginTestData;
  api: ApiTestData;
  performance: PerformanceBudget;
  usernames: Record<string, unknown>;
};

function readFileIfExists(filePath: string): unknown | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.load(raw);
  }
  return JSON.parse(raw);
}

function readRequired<T>(dir: string, fileName: string): T {
  const data = readFileIfExists(path.join(dir, fileName)) as T | undefined;
  if (!data) {
    throw new Error(`Missing test data file "${fileName}" for ENV=${env.name} in ${dir}`);
  }
  return data;
}

export function loadTestData(): AppTestData {
  const dir = testDataDir();
  return {
    env: env.name,
    login: readRequired<LoginTestData>(dir, 'login.json'),
    api: readRequired<ApiTestData>(dir, 'api.json'),
    performance: readRequired<PerformanceBudget>(dir, 'performance.json'),
    usernames: (readFileIfExists(path.join(dir, 'usernames.yaml')) as Record<string, unknown>) ?? {},
  };
}
