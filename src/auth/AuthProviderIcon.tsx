import { Image, StyleSheet, View } from 'react-native';

import type { AuthProviderType } from '@/auth/auth-sheet.types';
import { colors } from '@/theme/tokens';

const ICONS = {
  apple: require('../../assets/auth/apple-sheet.png'),
  google: require('../../assets/auth/google-sheet.png'),
  faceId: require('../../assets/auth/face-id-large.png'),
} as const;

type AuthProviderIconProps = {
  provider: AuthProviderType;
};

export function AuthProviderIcon({ provider }: AuthProviderIconProps) {
  if (provider === 'faceId') {
    return (
      <View style={styles.faceWrap} testID="auth-sheet-provider-icon">
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no"
          resizeMode="contain"
          source={ICONS.faceId}
          style={styles.faceIcon}
        />
      </View>
    );
  }

  return (
    <View style={styles.iconWell} testID="auth-sheet-provider-icon">
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="contain"
        source={ICONS[provider]}
        style={provider === 'apple' ? styles.appleIcon : styles.googleIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWell: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.authSheetCard,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appleIcon: {
    width: 31,
    height: 38,
  },
  googleIcon: {
    width: 34,
    height: 33,
  },
  faceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceIcon: {
    width: 64,
    height: 66,
  },
});
