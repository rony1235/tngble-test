import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import PhoneInput from 'react-native-phone-input';

import { colors, radii, typography } from '@/theme/tokens';

export type PhoneNumberFieldRef = PhoneInput;

type PhoneNumberFieldProps = {
  disabled?: boolean;
  testID?: string;
  onChangePhoneNumber?: (value: string, iso2: string) => void;
};

/**
 * Create Account phone field — `react-native-phone-input` styled to Figma `#15`
 * (flag, chevron, divider, dark fill). Defaults to UAE (+971).
 */
export const PhoneNumberField = forwardRef<PhoneInput, PhoneNumberFieldProps>(
  function PhoneNumberField({ disabled, testID, onChangePhoneNumber }, ref) {
    return (
      <View style={styles.wrap} testID={testID ? `${testID}-wrap` : undefined}>
        <PhoneInput
          ref={ref}
          accessibilityLabel="Your phone number"
          allowZeroAfterCountryCode={false}
          autoFormat
          disabled={disabled}
          initialCountry="ae"
          offset={8}
          onChangePhoneNumber={(displayValue, iso2) => {
            onChangePhoneNumber?.(displayValue, iso2);
          }}
          pickerBackgroundColor={colors.splashBackground}
          pickerButtonColor={colors.white}
          pickerItemStyle={styles.pickerItem}
          cancelTextStyle={styles.cancelText}
          confirmTextStyle={styles.confirmText}
          renderFlag={({ imageSource }) => (
            <View style={styles.flagCluster}>
              <Image
                accessibilityIgnoresInvertColors
                source={imageSource}
                style={styles.flag}
              />
              <Text style={styles.chevron}>▾</Text>
              <Text style={styles.divider}>|</Text>
            </View>
          )}
          style={styles.input}
          textProps={{
            autoComplete: 'tel',
            cursorColor: colors.white,
            placeholder: 'Your phone number *',
            placeholderTextColor: colors.white,
            returnKeyType: 'done',
            selectionColor: colors.brandCTA,
            testID,
            textContentType: 'telephoneNumber',
          }}
          textStyle={styles.text}
        />
      </View>
    );
  },
);

PhoneNumberField.displayName = 'PhoneNumberField';

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  flagCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    width: 16,
    height: 16,
    borderRadius: radii.sm / 2,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  chevron: {
    fontSize: 10,
    color: colors.white,
  },
  divider: {
    ...typography.input,
    color: colors.white,
    marginLeft: 2,
  },
  text: {
    ...typography.input,
    color: colors.white,
    height: 22,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  pickerItem: {
    color: colors.white,
    fontSize: 16,
  },
  cancelText: {
    color: colors.licensedText,
  },
  confirmText: {
    color: colors.signupAccent,
  },
});
