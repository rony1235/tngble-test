import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, typography } from '@/theme/tokens';

const VARA_LOGO = require('../../assets/brand/vara.png');

type LicensedByProps = {
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function LicensedBy({ style, testID = 'licensed-by' }: LicensedByProps) {
  return (
    <View style={[styles.row, style]} testID={testID}>
      <Text style={styles.label}>Licensed by:</Text>
      <Image
        accessibilityLabel="VARA — Virtual Assets Regulatory Authority"
        resizeMode="contain"
        source={VARA_LOGO}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    ...typography.licensed,
    color: colors.licensedText,
  },
  logo: {
    width: 61,
    height: 19,
  },
});
