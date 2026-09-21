import { Auth0Adapter } from '@/infrastructure/auth/Auth0Adapter';
import { getAuth0RuntimeConfig } from '@/infrastructure/auth/Auth0Config';

/**
 * TEMPORARY Phase 2 smoke helper — uses Auth0Adapter.
 * Remove once product auth UI owns Universal Login.
 * Never log token values — return presence flags only.
 */
export type Auth0SmokeResult = {
  hasAccessToken: boolean;
  hasIdToken: boolean;
  hasRefreshToken: boolean;
};

export async function runAuth0AuthorizeSmoke(): Promise<Auth0SmokeResult> {
  const config = getAuth0RuntimeConfig();
  const adapter = new Auth0Adapter({ config });
  const result = await adapter.signIn();
  const accessToken = await adapter.getAccessToken();

  return {
    hasAccessToken: Boolean(accessToken),
    hasIdToken: Boolean(result.user.id),
    // Adapter does not expose refresh token to JS on purpose; assume granted when access works.
    hasRefreshToken: Boolean(accessToken),
  };
}
