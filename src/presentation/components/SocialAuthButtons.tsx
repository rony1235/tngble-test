import { View, StyleSheet } from 'react-native';

import { SocialAuthButton } from '@/components/SocialAuthButton';
import type { SocialProvider } from '@/domain/auth';

type SocialAuthButtonsProps = {
  disabled?: boolean;
  onPress: (provider: SocialProvider) => void;
  appleTestID?: string;
  googleTestID?: string;
};

export function SocialAuthButtons({
  disabled,
  onPress,
  appleTestID = 'login-apple',
  googleTestID = 'login-google',
}: SocialAuthButtonsProps) {
  return (
    <View style={styles.wrap}>
      <SocialAuthButton
        disabled={disabled}
        label="Continue with Apple"
        onPress={() => onPress('apple')}
        provider="apple"
        testID={appleTestID}
      />
      <SocialAuthButton
        disabled={disabled}
        label="Continue with Google"
        onPress={() => onPress('google')}
        provider="google"
        testID={googleTestID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 12,
  },
});
