import type { APIRequestContext, APIResponse } from '@playwright/test';

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(url: string, options?: Parameters<APIRequestContext['get']>[1]): Promise<APIResponse> {
    return this.request.get(url, options);
  }

  post(url: string, options?: Parameters<APIRequestContext['post']>[1]): Promise<APIResponse> {
    return this.request.post(url, options);
  }

  async expectOk(response: APIResponse): Promise<APIResponse> {
    if (!response.ok()) {
      throw new Error(`Expected OK response, got ${response.status()} ${response.statusText()} for ${response.url()}`);
    }
    return response;
  }
}
