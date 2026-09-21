import { getAuth0PublicConfig, type Auth0PublicConfig } from '@/infrastructure/config/env';

/**
 * Must match `app.config.ts` Auth0 plugin `customScheme` and Expo `scheme`.
 * Keep this constant in sync — do not import from app.config (Node-only).
 */
export const AUTH0_CUSTOM_SCHEME = 'tngble';

export const AUTH0_SCOPES = 'openid profile email offline_access';

export type Auth0RuntimeConfig = Auth0PublicConfig & {
  customScheme: typeof AUTH0_CUSTOM_SCHEME;
  scope: typeof AUTH0_SCOPES;
};

export function getAuth0RuntimeConfig(): Auth0RuntimeConfig {
  const publicConfig = getAuth0PublicConfig();
  return {
    ...publicConfig,
    customScheme: AUTH0_CUSTOM_SCHEME,
    scope: AUTH0_SCOPES,
  };
}

/** Callback URL templates for the Auth0 Native application dashboard. */
export function getAuth0CallbackUrls(domain: string = getAuth0PublicConfig().domain): {
  ios: string;
  android: string;
} {
  return {
    ios: `${AUTH0_CUSTOM_SCHEME}://${domain}/ios/com.tngble.app/callback`,
    android: `${AUTH0_CUSTOM_SCHEME}://${domain}/android/com.tngble.app/callback`,
  };
}
