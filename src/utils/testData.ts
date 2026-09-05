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

export type BrowseTestData = {
  topics: Record<string, { path: string }>;
  features: Record<string, { pathSegment: string }>;
};

export type AppTestData = {
  env: string;
  login: LoginTestData;
  api: ApiTestData;
  performance: PerformanceBudget;
  browse: BrowseTestData;
};

function readJsonIfExists(filePath: string): unknown | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sharedTestDataDir(): string {
  return path.resolve(process.cwd(), 'test-data');
}

function readRequired<T>(fileName: string): T {
  const override = readJsonIfExists(path.join(testDataDir(), fileName)) as T | undefined;
  const shared = readJsonIfExists(path.join(sharedTestDataDir(), fileName)) as T | undefined;
  const data = override ?? shared;
  if (!data) {
    throw new Error(
      `Missing test data file "${fileName}" for ENV=${env.name} (checked ${testDataDir()} then ${sharedTestDataDir()})`,
    );
  }
  return data;
}

export function loadTestData(): AppTestData {
  return {
    env: env.name,
    login: readRequired<LoginTestData>('login.json'),
    api: readRequired<ApiTestData>('api.json'),
    performance: readRequired<PerformanceBudget>('performance.json'),
    browse: readRequired<BrowseTestData>('browse.json'),
  };
}
