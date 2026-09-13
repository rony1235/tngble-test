import { api } from '@/api/client';
import type { LoginCredentials, Session } from '@/auth/types';

export async function loginRequest(credentials: LoginCredentials): Promise<Session> {
  if (process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false') {
    await delay(400);

    if (!credentials.email.includes('@') || credentials.password.length < 6) {
      throw new Error('Invalid email or password');
    }

    return {
      accessToken: 'mock-access-token',
      user: {
        id: 'user_demo',
        email: credentials.email.trim().toLowerCase(),
      },
    };
  }

  return api<Session>('/auth/login', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
