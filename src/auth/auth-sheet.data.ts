import type { AuthProviderType, AuthSheetMockUser } from '@/auth/auth-sheet.types';

export const AUTH_SHEET_MOCK_USER: AuthSheetMockUser = {
  name: 'Mr. Zabbar Khan',
  email: 'name@example.com',
};

export const AUTH_SHEET_MOCK_PASSWORD = 'social-mock';

export const AUTH_SHEETS = {
  apple: {
    title: 'Sign in with Apple',
    subtitle: 'Connect with apple id',
    description: 'Sign in to TNGBLE using your Apple account',
    sheetHeight: 398,
    showsAccount: true,
    showsConnect: true,
    autoStart: false,
  },
  google: {
    title: 'Sign in with Google',
    subtitle: 'Connect with google id',
    description: 'Sign in to TNGBLE using your Google account',
    sheetHeight: 398,
    showsAccount: true,
    showsConnect: true,
    autoStart: false,
  },
  faceId: {
    title: 'Sign in with Face ID',
    subtitle: 'Connecting with your device',
    description: null,
    sheetHeight: 331,
    showsAccount: false,
    showsConnect: false,
    autoStart: true,
  },
} as const satisfies Record<
  AuthProviderType,
  {
    title: string;
    subtitle: string;
    description: string | null;
    sheetHeight: number;
    showsAccount: boolean;
    showsConnect: boolean;
    autoStart: boolean;
  }
>;
