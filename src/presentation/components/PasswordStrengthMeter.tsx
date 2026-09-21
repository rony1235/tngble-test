import { StyleSheet, Text, View } from 'react-native';

import {
  assessPasswordStrength,
  passwordStrengthFilledBars,
  passwordStrengthLabel,
  type PasswordStrength,
} from '@/presentation/utils/passwordStrength';
import { colors, typography } from '@/theme/tokens';

type PasswordStrengthMeterProps = {
  password: string;
  testID?: string;
};

function barColor(strength: PasswordStrength, index: number, filled: number): string {
  if (index >= filled) return colors.progressInactive;
  if (strength === 'weak') return colors.passwordWeak;
  if (strength === 'medium') return colors.passwordMedium;
  return colors.passwordStrong;
}

export function PasswordStrengthMeter({ password, testID }: PasswordStrengthMeterProps) {
  const strength = assessPasswordStrength(password);
  const filled = passwordStrengthFilledBars(strength);
  const label = passwordStrengthLabel(strength);

  if (strength === 'empty') {
    return <View style={styles.placeholder} testID={testID} />;
  }

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.bar, { backgroundColor: barColor(strength, index, filled) }]}
          />
        ))}
      </View>
      <Text
        style={[
          styles.label,
          strength === 'weak' && styles.labelWeak,
          strength === 'medium' && styles.labelMedium,
          strength === 'strong' && styles.labelStrong,
        ]}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 29,
    width: '100%',
  },
  wrap: {
    width: '100%',
    height: 29,
    justifyContent: 'flex-start',
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    marginBottom: -4,
  },
  bar: {
    flex: 1,
    height: 4,
    minWidth: 4,
    borderRadius: 1234,
  },
  label: {
    ...typography.input,
    fontSize: 12,
    lineHeight: 30,
    letterSpacing: -0.072,
    opacity: 0.6,
    color: colors.outlineLabel,
  },
  labelWeak: {
    color: colors.passwordWeak,
    opacity: 1,
  },
  labelMedium: {
    color: colors.passwordMedium,
    opacity: 1,
  },
  labelStrong: {
    color: colors.passwordStrong,
    opacity: 1,
  },
});
