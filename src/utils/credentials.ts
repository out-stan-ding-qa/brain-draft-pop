import { requireCredentials } from '../config/env';
import type { LoginTestData } from './testData';

export type CredentialKind = 'valid' | 'invalid' | 'blank';

function assertKind(kind: string): asserts kind is CredentialKind {
  if (kind !== 'valid' && kind !== 'invalid' && kind !== 'blank') {
    throw new Error(`Unknown credential kind "${kind}". Use valid, invalid, or blank.`);
  }
}

export function resolveUsername(kind: string, data: LoginTestData): string {
  assertKind(kind);
  switch (kind) {
    case 'valid':
      return requireCredentials().username;
    case 'invalid':
      return data.invalidUsername;
    case 'blank':
      return '';
  }
}

export function resolvePassword(kind: string, data: LoginTestData): string {
  assertKind(kind);
  switch (kind) {
    case 'valid':
      return requireCredentials().password;
    case 'invalid':
      return data.wrongPassword;
    case 'blank':
      return '';
  }
}
