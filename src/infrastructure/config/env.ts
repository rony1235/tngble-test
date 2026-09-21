export type Auth0PublicConfig = {
  domain: string;
  clientId: string;
  /**
   * Optional API identifier. Omit when the app has no backend API —
   * Auth0 still issues ID tokens; access tokens are for Auth0 only.
   */
  audience?: string;
};

export type AppEnv = {
  apiUrl: string;
  /** Present when domain + clientId are set; otherwise null. */
  auth0: Auth0PublicConfig | null;
  /**
   * @deprecated Product auth uses Auth0 (AUTH-01). Prefer FakeAuthAdapter in tests.
   * Still read for legacy mock login until that path is removed.
   */
  useMockAuth: boolean;
};

function trimEnv(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Requires Auth0 domain + client ID. Audience is optional (no-backend apps).
 */
export function getAuth0PublicConfig(): Auth0PublicConfig {
  const domain = trimEnv(process.env.EXPO_PUBLIC_AUTH0_DOMAIN);
  const clientId = trimEnv(process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID);
  const audience = trimEnv(process.env.EXPO_PUBLIC_AUTH0_AUDIENCE);

  const missing: string[] = [];
  if (!domain) missing.push('EXPO_PUBLIC_AUTH0_DOMAIN');
  if (!clientId) missing.push('EXPO_PUBLIC_AUTH0_CLIENT_ID');

  if (missing.length > 0) {
    throw new Error(
      `Missing Auth0 public config: ${missing.join(', ')}. See docs/auth0-phase-0-prerequisites.md`,
    );
  }

  return {
    domain: domain!,
    clientId: clientId!,
    ...(audience ? { audience } : {}),
  };
}

/** Non-throwing read for boot / feature flags while Auth0 env is still empty. */
export function tryGetAuth0PublicConfig(): Auth0PublicConfig | null {
  try {
    return getAuth0PublicConfig();
  } catch {
    return null;
  }
}

export function getAppEnv(): AppEnv {
  return {
    apiUrl: trimEnv(process.env.EXPO_PUBLIC_API_URL) ?? 'http://localhost:3000',
    auth0: tryGetAuth0PublicConfig(),
    useMockAuth: process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false',
  };
}
