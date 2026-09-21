import { useEffect, useMemo, type ReactNode } from 'react';

import {
  ApplicationAuthProvider,
  AuthServiceProvider,
  createAppAuthService,
  useAuthService,
} from '@/application';
import { ConsentProvider } from '@/providers/ConsentProvider';
import { Auth0AppProvider } from '@/infrastructure/auth/Auth0AppProvider';
import { setAccessTokenAccessor } from '@/infrastructure/auth/tokenAccessor';
import { tryGetAuth0PublicConfig } from '@/infrastructure/config/env';

function AccessTokenBridge({ children }: { children: ReactNode }) {
  const service = useAuthService();

  useEffect(() => {
    setAccessTokenAccessor(() => service.getAccessToken());
    return () => setAccessTokenAccessor(null);
  }, [service]);

  return children;
}

/**
 * Composition root: Auth0 → AuthService → ApplicationAuth → Consent.
 * Auth0 SDK is mounted only via `Auth0AppProvider` (infrastructure).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const auth0 = tryGetAuth0PublicConfig();
  const service = useMemo(() => createAppAuthService(), []);

  const tree = (
    <AuthServiceProvider service={service}>
      <ApplicationAuthProvider>
        <AccessTokenBridge>
          <ConsentProvider>{children}</ConsentProvider>
        </AccessTokenBridge>
      </ApplicationAuthProvider>
    </AuthServiceProvider>
  );

  if (!auth0) {
    return tree;
  }

  return <Auth0AppProvider config={auth0}>{tree}</Auth0AppProvider>;
}
