import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

const SUCCESS = require('../../assets/auth/signing-success.png');

type AuthSigningStatusProps = {
  label?: string;
};

export function AuthSigningStatus({ label = 'Signing in' }: AuthSigningStatusProps) {
  return (
    <View style={styles.wrap} testID="auth-sheet-signing-in">
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="contain"
        source={SUCCESS}
        style={styles.icon}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 59,
  },
  icon: {
    width: 39,
    height: 39,
    marginVertical: 10,
  },
  label: {
    ...typography.authSigningIn,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
});
