import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { colors, radii, typography } from '@/theme/tokens';

const ICONS = {
  apple: require('../../assets/auth/apple.png'),
  google: require('../../assets/auth/google.png'),
} as const;

type SocialProvider = keyof typeof ICONS;

type SocialAuthButtonProps = PressableProps & {
  provider: SocialProvider;
  label: string;
};

export function SocialAuthButton({
  provider,
  label,
  disabled,
  ...props
}: SocialAuthButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...props}
    >
      <View style={styles.content}>
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no"
          resizeMode="contain"
          source={ICONS[provider]}
          style={styles.icon}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    width: '100%',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.socialBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  label: {
    ...typography.cta,
    color: colors.outlineLabel,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
