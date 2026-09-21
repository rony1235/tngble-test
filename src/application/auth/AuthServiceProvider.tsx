import { createContext, useContext, type ReactNode } from 'react';

import type { AuthService } from '@/domain/auth';

const AuthServiceContext = createContext<AuthService | null>(null);

export function AuthServiceProvider({
  service,
  children,
}: {
  service: AuthService;
  children: ReactNode;
}) {
  return (
    <AuthServiceContext.Provider value={service}>{children}</AuthServiceContext.Provider>
  );
}

export function useAuthService(): AuthService {
  const service = useContext(AuthServiceContext);
  if (!service) {
    throw new Error('useAuthService must be used inside AuthServiceProvider');
  }
  return service;
}
