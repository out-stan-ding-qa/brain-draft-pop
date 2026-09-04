import fs from 'node:fs';
import path from 'node:path';
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
};

function readJsonIfExists(filePath: string): unknown | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readRequired<T>(dir: string, fileName: string): T {
  const data = readJsonIfExists(path.join(dir, fileName)) as T | undefined;
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
  };
}
