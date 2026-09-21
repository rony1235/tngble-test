export { Auth0AppProvider } from './Auth0AppProvider';
export {
  AUTH0_CUSTOM_SCHEME,
  AUTH0_SCOPES,
  getAuth0CallbackUrls,
  getAuth0RuntimeConfig,
  type Auth0RuntimeConfig,
} from './Auth0Config';
export {
  Auth0Adapter,
  AUTH0_DB_CONNECTION,
  AUTH0_PASSWORDLESS_EMAIL_CONNECTION,
  PASSWORDLESS_OTP_GRANT,
  type Auth0AdapterOptions,
  type Auth0ClientLike,
} from './Auth0Adapter';
export {
  FakeAuthAdapter,
  FAKE_EMAIL_OTP,
  type FakeAuthAdapterOptions,
  type FakeAuthScenario,
} from './FakeAuthAdapter';
export { mapAuth0Error, toAuthError } from './auth0Errors';
export {
  inferProviderFromUser,
  mapAuth0UserToDomain,
  mapCredentialsToAuthResult,
  mapSocialConnection,
} from './mappers';
export { runAuth0AuthorizeSmoke, type Auth0SmokeResult } from './auth0Smoke';
export {
  getAccessTokenFromAuthService,
  setAccessTokenAccessor,
} from './tokenAccessor';
