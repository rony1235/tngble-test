import { forwardRef, type ReactNode, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/theme/accessibility';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  variant?: 'default' | 'login';
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    variant = 'default',
    trailing,
    containerStyle,
    style,
    onFocus,
    onBlur,
    onChangeText,
    value,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const isLogin = variant === 'login';

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label && !isLogin ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          isLogin ? styles.loginField : styles.defaultField,
          focused && isLogin ? styles.loginFocused : null,
          error ? (isLogin ? styles.loginError : styles.inputError) : null,
        ]}
      >
        <TextInput
          ref={ref}
          cursorColor={isLogin ? colors.white : colors.text}
          selectionColor={colors.brandCTA}
          underlineColorAndroid="transparent"
          {...props}
          accessibilityLabel={label ?? props.placeholder ?? undefined}
          autoCapitalize="none"
          autoCorrect={false}
          maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? MAX_FONT_SIZE_MULTIPLIER}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={isLogin ? colors.white : colors.textMuted}
          style={[isLogin ? styles.loginInput : styles.input, style]}
          value={value}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  defaultField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 52,
    justifyContent: 'center',
  },
  loginField: {
    backgroundColor: colors.inputFill,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // Always reserve 1px so focus/error borders don't shrink the text box
    borderWidth: 1,
    borderColor: 'transparent',
    width: '100%',
  },
  loginFocused: {
    borderColor: colors.brandCTA,
  },
  loginError: {
    borderColor: colors.danger,
  },
  input: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    flex: 1,
    padding: 0,
    margin: 0,
    ...Platform.select({
      ios: {
        // lineHeight on iOS TextInput pins glyphs toward the bottom of the field
      },
      android: {
        textAlignVertical: 'center' as const,
        includeFontPadding: false,
      },
      default: {},
    }),
  },
  loginInput: {
    fontSize: typography.input.fontSize,
    fontWeight: typography.input.fontWeight,
    color: colors.white,
    flex: 1,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        // Keep font metrics only — lineHeight + vertical padding mis-align on iOS
      },
      android: {
        textAlignVertical: 'center' as const,
        includeFontPadding: false,
      },
      default: {},
    }),
  },
  trailing: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.label,
    color: colors.danger,
  },
});
