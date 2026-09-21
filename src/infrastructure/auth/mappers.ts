import { parseIdToken, type Credentials, type User as Auth0User } from 'react-native-auth0';

import type { AuthIdentityProvider, AuthResult, SocialProvider, User } from '@/domain/auth';

export function mapSocialConnection(provider: SocialProvider): string {
  return provider === 'google' ? 'google-oauth2' : 'apple';
}

export function mapAuth0UserToDomain(
  auth0User: Auth0User,
  provider?: AuthIdentityProvider,
): User {
  return {
    id: auth0User.sub,
    email: auth0User.email ?? '',
    emailVerified: Boolean(auth0User.emailVerified),
    name: auth0User.name,
    provider,
  };
}

export function mapCredentialsToAuthResult(
  credentials: Credentials,
  provider?: AuthIdentityProvider,
): AuthResult {
  if (!credentials.idToken) {
    throw new Error('Missing ID token in Auth0 credentials');
  }
  const auth0User = parseIdToken(credentials.idToken);
  return {
    user: mapAuth0UserToDomain(auth0User, provider),
  };
}

export function inferProviderFromUser(auth0User: Auth0User): AuthIdentityProvider | undefined {
  const sub = auth0User.sub ?? '';
  if (sub.startsWith('google-oauth2|')) return 'google';
  if (sub.startsWith('apple|')) return 'apple';
  if (sub.includes('|')) return 'database';
  return undefined;
}
