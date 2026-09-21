import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  ApplicationAuthProvider,
  AuthServiceProvider,
} from '@/application';
import { ConsentProvider } from '@/providers/ConsentProvider';
import {
  FakeAuthAdapter,
  type FakeAuthAdapterOptions,
} from '@/infrastructure/auth/FakeAuthAdapter';

export const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

export function createTestAuthService(options?: FakeAuthAdapterOptions) {
  return new FakeAuthAdapter(options);
}

export async function renderAuthUi(
  ui: ReactElement,
  options?: {
    service?: FakeAuthAdapter;
    autoRestore?: boolean;
  },
) {
  const service = options?.service ?? createTestAuthService();
  const result = await render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <AuthServiceProvider service={service}>
        <ApplicationAuthProvider autoRestore={options?.autoRestore ?? false}>
          <ConsentProvider>{ui}</ConsentProvider>
        </ApplicationAuthProvider>
      </AuthServiceProvider>
    </SafeAreaProvider>,
  );
  return { ...result, service };
}
