import { expect } from '@playwright/test';
import type { LoginApiResult } from '../api/loginApi';
import type { ApiTestData } from '../testData';

export function expectApiLoginSucceeded(
  result: LoginApiResult,
  username: string,
  expected: ApiTestData,
): void {
  expect(result.status).toBe(expected.successStatus);
  expect(result.body.status_code).toBe(expected.successCode);
  expect(result.body.message).toBe(expected.successMessage);

  const user = result.body.data?.settings?.user;
  expect(user?.username).toBe(username);
  expect(user?.logged_in).toBe(true);
  expect(user?.sessionid).toBeTruthy();
}

export function expectApiLoginRejected(result: LoginApiResult, expected: ApiTestData): void {
  expect(result.status).toBe(expected.failureStatus);
  expect(result.body.status_code).toBe(expected.failureCode);
  expect(result.body.message).toBe(expected.failureMessage);
  expect(result.body.data).toBeUndefined();
}
