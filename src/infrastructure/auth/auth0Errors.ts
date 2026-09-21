import { mapProviderError, type AuthError } from '@/domain/auth';

/**
 * Auth0 / native SDK error → domain AuthError.
 */
export function mapAuth0Error(error: unknown): AuthError {
  return mapProviderError(error);
}

export function toAuthError(error: unknown): AuthError {
  return mapAuth0Error(error);
}
