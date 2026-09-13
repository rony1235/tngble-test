export type AuthProviderType = 'apple' | 'google' | 'faceId';

export type AuthSheetStatus = 'ready' | 'connecting' | 'success' | 'error';

export type AuthSheetMockUser = {
  name: string;
  email: string;
};
