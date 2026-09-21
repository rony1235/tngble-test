jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: () => false,
    }),
    useLocalSearchParams: () => ({}),
    Link: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
      React.createElement(Text, { accessibilityRole: 'link', testID }, children),
    Redirect: () => null,
    Stack: { Screen: () => null, Protected: ({ children }: { children: React.ReactNode }) => children },
  };
});

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(async () => undefined),
}));

jest.mock('@/infrastructure/storage/LocalConsentStore', () => ({
  getLocalConsent: jest.fn(async () => null),
  setLocalConsent: jest.fn(async () => undefined),
  clearLocalConsent: jest.fn(async () => undefined),
}));

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Picker = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: 'country-picker' }, children);
  Picker.Item = () => null;
  return { Picker };
});
