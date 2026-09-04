import type { APIResponse } from '@playwright/test';
import { env } from '../../config/env';
import { logger } from '../logger';
import type { ApiClient } from './client';

export const LOGIN_ENDPOINT = '/api/login';

const TOO_MANY_REQUESTS = 429;
const MAX_ATTEMPTS = 4;

export type LoginApiUser = {
  username?: string;
  logged_in?: boolean;
  sessionid?: string;
};

export type LoginApiBody = {
  status_code?: number;
  message?: string;
  data?: {
    user_id?: string;
    user_type?: string;
    first_name?: string;
    last_name?: string;
    settings?: { user?: LoginApiUser };
  };
};

export type LoginApiResult = {
  status: number;
  body: LoginApiBody;
};

/**
 * Service object for the authentication endpoint the login page posts to.
 * Owns the request shape and throttling behaviour, never the assertions.
 */
export class LoginApi {
  private lastCall?: LoginApiResult;

  constructor(private readonly api: ApiClient) {}

  async login(username: string, password: string): Promise<LoginApiResult> {
    let response = await this.post(username, password);

    // The endpoint throttles bursts of login attempts, so back off rather than
    // letting an unrelated 429 fail the credential assertions.
    for (let attempt = 1; attempt < MAX_ATTEMPTS && response.status() === TOO_MANY_REQUESTS; attempt += 1) {
      const waitMs = retryAfterMs(response) ?? 1_000 * 2 ** (attempt - 1);
      logger.warn('login-api-throttled', { attempt, waitMs });
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      response = await this.post(username, password);
    }

    this.lastCall = { status: response.status(), body: await readJson(response) };
    return this.lastCall;
  }

  get lastResult(): LoginApiResult {
    if (!this.lastCall) {
      throw new Error('No login API call has been made in this scenario yet');
    }
    return this.lastCall;
  }

  private post(username: string, password: string): Promise<APIResponse> {
    return this.api.post(`${env.apiBaseURL}${LOGIN_ENDPOINT}`, {
      data: { username, password, action: '', code: '' },
    });
  }
}

function retryAfterMs(response: APIResponse): number | undefined {
  const header = response.headers()['retry-after'];
  const seconds = header ? Number.parseInt(header, 10) : Number.NaN;
  return Number.isNaN(seconds) ? undefined : seconds * 1_000;
}

async function readJson(response: APIResponse): Promise<LoginApiBody> {
  try {
    return (await response.json()) as LoginApiBody;
  } catch {
    return { message: (await response.text()).slice(0, 200) };
  }
}
