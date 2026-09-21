/**
 * Opaque credential bag from Auth0 Credentials Manager.
 * Kept local so storage does not import the Auth0 SDK (Phase 9 / D06).
 */
export type AuthCredentials = {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
  [key: string]: unknown;
};

/**
 * Thin façade over Auth0's credentials manager.
 * Tokens must not be duplicated into SecureStore / AsyncStorage.
 */
export type Auth0CredentialsManagerLike = {
  saveCredentials(credentials: AuthCredentials): Promise<void>;
  getCredentials(
    scope?: string,
    minTtl?: number,
    parameters?: Record<string, unknown>,
    forceRefresh?: boolean,
  ): Promise<AuthCredentials>;
  clearCredentials(): Promise<void>;
  hasValidCredentials(minTtl?: number): Promise<boolean>;
};

export class CredentialsManager {
  constructor(private readonly manager: Auth0CredentialsManagerLike) {}

  save(credentials: AuthCredentials): Promise<void> {
    return this.manager.saveCredentials(credentials);
  }

  get(
    scope?: string,
    minTtl?: number,
    parameters?: Record<string, unknown>,
    forceRefresh?: boolean,
  ): Promise<AuthCredentials> {
    return this.manager.getCredentials(scope, minTtl, parameters, forceRefresh);
  }

  clear(): Promise<void> {
    return this.manager.clearCredentials();
  }

  hasValid(minTtl?: number): Promise<boolean> {
    return this.manager.hasValidCredentials(minTtl);
  }
}
