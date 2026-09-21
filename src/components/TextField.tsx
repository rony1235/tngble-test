import { forwardRef, type ReactNode, useState } from 'react';
import {
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
    minHeight: 52,
    justifyContent: 'center',
  },
  loginField: {
    backgroundColor: colors.inputFill,
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 0,
    width: '100%',
  },
  loginFocused: {
    borderWidth: 1,
    borderColor: colors.brandCTA,
  },
  loginError: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  loginInput: {
    ...typography.input,
    color: colors.white,
    flex: 1,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
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
