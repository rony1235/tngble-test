import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

type ConsentCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  testID?: string;
  error?: string;
  /** Opens the full Terms screen (Figma T&C). */
  onOpenTerms?: () => void;
};

export function ConsentCheckbox({
  checked,
  onCheckedChange,
  label = 'I agree to the Terms of Service and Privacy Policy',
  disabled,
  testID = 'consent-checkbox',
  error,
  onOpenTerms,
}: ConsentCheckboxProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked, disabled: Boolean(disabled) }}
          disabled={disabled}
          hitSlop={8}
          onPress={() => onCheckedChange(!checked)}
          style={styles.boxHit}
          testID={testID}
        >
          <View style={[styles.box, checked && styles.boxChecked, disabled && styles.disabled]}>
            {checked ? <Text style={styles.mark}>✓</Text> : null}
          </View>
        </Pressable>
        <View style={styles.labelCol}>
          <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>
          {onOpenTerms ? (
            <Pressable
              accessibilityRole="link"
              disabled={disabled}
              hitSlop={4}
              onPress={onOpenTerms}
              testID={`${testID}-open-terms`}
            >
              <Text style={styles.link}>View Terms and Conditions</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  boxHit: {
    paddingTop: 1,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.outlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.brandCTA,
    borderColor: colors.brandCTA,
  },
  mark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.label,
    color: colors.licensedText,
  },
  link: {
    ...typography.label,
    color: colors.signupAccent,
    textDecorationLine: 'underline',
  },
  error: {
    ...typography.label,
    color: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
});
