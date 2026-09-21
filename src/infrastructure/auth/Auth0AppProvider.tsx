import type { ReactNode } from 'react';
import { Auth0Provider } from 'react-native-auth0';

import type { Auth0PublicConfig } from '@/infrastructure/config/env';

/**
 * Sole composition wrapper for `Auth0Provider`.
 * Keeps `react-native-auth0` imports inside `infrastructure/auth` (Phase 9 / D06).
 */
export function Auth0AppProvider({
  config,
  children,
}: {
  config: Auth0PublicConfig;
  children: ReactNode;
}) {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      {children}
    </Auth0Provider>
  );
}
