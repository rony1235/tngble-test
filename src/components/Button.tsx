import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'ghost' | 'brand' | 'social';

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const indicatorColor =
    variant === 'brand' || variant === 'primary' ? colors.white : colors.text;
  const isBrand = variant === 'brand';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        isBrand && styles.brand,
        variant === 'social' && styles.social,
        pressed && !isDisabled && variant === 'primary' && styles.pressed,
        pressed && !isDisabled && isBrand && styles.brandPressed,
        pressed && !isDisabled && (variant === 'ghost' || variant === 'social') && styles.softPressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={indicatorColor} />
        ) : (
          <Text
            style={[
              styles.label,
              variant === 'ghost' && styles.ghostLabel,
              isBrand && styles.brandLabel,
              variant === 'social' && styles.socialLabel,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    backgroundColor: colors.brandCTA,
    minHeight: 48,
    height: 48,
    borderRadius: radii.pill,
    paddingHorizontal: 32,
    width: '100%',
  },
  social: {
    backgroundColor: 'transparent',
    minHeight: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.socialBorder,
    paddingHorizontal: 32,
    width: '100%',
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  brandPressed: {
    backgroundColor: colors.brandCTAPressed,
  },
  softPressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
  ghostLabel: {
    color: colors.text,
  },
  brandLabel: {
    ...typography.cta,
    color: colors.white,
  },
  socialLabel: {
    ...typography.cta,
    color: colors.outlineLabel,
  },
});
