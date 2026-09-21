import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

type ErrorBannerProps = {
  message: string;
  /**
   * @deprecated Provider/raw detail is never shown in UI — safe `message` only.
   */
  detail?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<TextStyle>;
};

/** User-facing auth errors — safe message only (no Auth0 / code details). */
export function ErrorBanner({ message, testID, style, messageStyle }: ErrorBannerProps) {
  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <Text style={[styles.error, messageStyle]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
    gap: 4,
  },
  error: {
    ...typography.label,
    color: colors.danger,
  },
});
