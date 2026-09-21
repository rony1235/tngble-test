import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from 'react-native';

import { VERIFICATION_CODE_LENGTH } from '@/domain/sanitization';
import { colors, typography } from '@/theme/tokens';

type VerificationCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * Figma `#19` six OTP cells (42×42, #1E1D23, focused border #797A7D).
 */
export function VerificationCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  testID = 'verify-code',
}: VerificationCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const onCompleteRef = useRef(onComplete);
  const lastCompletedRef = useRef<string | null>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.padEnd(VERIFICATION_CODE_LENGTH, ' ').slice(0, VERIFICATION_CODE_LENGTH).split('');
  const activeIndex = Math.min(value.length, VERIFICATION_CODE_LENGTH - 1);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (value.length === VERIFICATION_CODE_LENGTH) {
      if (lastCompletedRef.current === value) return;
      lastCompletedRef.current = value;
      onCompleteRef.current?.(value);
      return;
    }
    lastCompletedRef.current = null;
  }, [value]);

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        accessibilityLabel="Verification code"
        disabled={disabled}
        onPress={() => inputRef.current?.focus()}
        style={styles.row}
      >
        {digits.map((digit, index) => {
          const filled = digit.trim().length > 0;
          const isActive = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[styles.cell, isActive && styles.cellFocused]}
              testID={`${testID}-cell-${index}`}
            >
              <Text style={[styles.cellText, !filled && styles.placeholder]}>
                {filled ? digit : '—'}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        autoComplete="one-time-code"
        caretHidden
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={VERIFICATION_CODE_LENGTH}
        onBlur={() => setFocused(false)}
        onChangeText={(next) => {
          const normalized = next.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH);
          onChange(normalized);
        }}
        onFocus={() => setFocused(true)}
        onKeyPress={(event: TextInputKeyPressEvent) => {
          if (event.nativeEvent.key === 'Backspace' && value.length > 0) {
            // handled by onChangeText
          }
        }}
        style={styles.hiddenInput}
        testID={`${testID}-input`}
        textContentType="oneTimeCode"
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1E1D23',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellFocused: {
    borderColor: '#797A7D',
  },
  cellText: {
    ...typography.cta,
    color: colors.white,
    textAlign: 'center',
  },
  placeholder: {
    color: '#9C9C9C',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
