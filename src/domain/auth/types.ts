export type SocialProvider = 'google' | 'apple';

export type AuthIdentityProvider = 'database' | SocialProvider;

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  provider?: AuthIdentityProvider;
};

export type AuthResult = {
  user: User;
};

export type SignUpInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  /** Collected for UX; phone verification is INV-US008 (next sprint). */
  phone?: string;
};

export type SignInInput = {
  email?: string;
  /** When set with email, uses native Password Grant; otherwise Universal Login. */
  password?: string;
};
