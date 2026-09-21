module.exports = {
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webAuth: {
      authorize: jest.fn(),
      clearSession: jest.fn(),
    },
    credentialsManager: {
      saveCredentials: jest.fn(),
      getCredentials: jest.fn(),
      clearCredentials: jest.fn(),
      hasValidCredentials: jest.fn(),
    },
    auth: {
      resetPassword: jest.fn(),
      createUser: jest.fn(),
      passwordRealm: jest.fn(),
    },
    passwordless: {
      challengeWithEmail: jest.fn(),
      loginWithOTP: jest.fn(),
    },
  })),
  Auth0Provider: ({ children }) => children,
  useAuth0: () => ({
    authorize: jest.fn(),
    clearSession: jest.fn(),
    user: null,
    isLoading: false,
  }),
  parseIdToken: jest.fn((idToken) => {
    if (idToken === 'id-google') {
      return {
        sub: 'google-oauth2|123',
        email: 'google@tngble.app',
        emailVerified: true,
        name: 'Google User',
      };
    }
    if (idToken === 'id-apple') {
      return {
        sub: 'apple|123',
        email: 'apple@tngble.app',
        emailVerified: true,
        name: 'Apple User',
      };
    }
    if (idToken === 'id-unverified') {
      return {
        sub: 'auth0|123',
        email: 'pending@tngble.app',
        emailVerified: false,
      };
    }
    return {
      sub: 'auth0|123',
      email: 'dev@tngble.app',
      emailVerified: true,
      name: 'Dev User',
    };
  }),
};
