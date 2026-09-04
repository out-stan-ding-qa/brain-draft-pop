import { env, type RemoteProvider } from './env';

export type RemoteCapabilities = Record<string, unknown>;

/**
 * Capability builders for cloud/grid providers. Default runs are local, so these
 * are only consulted when REMOTE_PROVIDER is set to something other than "none".
 */
export function buildRemoteCapabilities(
  provider: RemoteProvider,
  browserName: string,
): RemoteCapabilities {
  const build = process.env.GITHUB_SHA ?? 'local';

  switch (provider) {
    case 'browserstack':
      return {
        browser: browserName,
        'browserstack.username': env.browserstackUsername,
        'browserstack.accessKey': env.browserstackAccessKey,
        projectName: 'brainpop-playwright',
        buildName: build,
        sessionName: `playwright-${browserName}`,
      };
    case 'lambdatest':
      return {
        browserName,
        user: env.lambdatestUsername,
        accessKey: env.lambdatestAccessKey,
        platform: 'Windows 11',
        build,
        name: `playwright-${browserName}`,
      };
    case 'selenium':
      return { browserName, 'selenoid:options': { enableVNC: true, enableVideo: false } };
    default:
      return {};
  }
}

/**
 * Providers expect capabilities encoded on the websocket endpoint rather than in
 * Playwright's `use` block, so build the full endpoint here.
 */
export function remoteConnectOptions(
  provider: RemoteProvider,
  browserName: string,
): { wsEndpoint: string } | undefined {
  if (provider === 'none' || !env.remoteWsEndpoint) {
    return undefined;
  }
  const caps = buildRemoteCapabilities(provider, browserName);
  const separator = env.remoteWsEndpoint.includes('?') ? '&' : '?';
  return { wsEndpoint: `${env.remoteWsEndpoint}${separator}caps=${encodeURIComponent(JSON.stringify(caps))}` };
}
