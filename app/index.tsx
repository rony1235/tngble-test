import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';

export default function Index() {
  const { isAuthenticated } = useAuth();

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/onboarding'} />;
}
