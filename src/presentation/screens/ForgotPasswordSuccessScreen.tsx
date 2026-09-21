import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { colors } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';
import CheckmarkBadge from '../../../assets/auth/checkmark-badge.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
const BADGE_SIZE = 160;

/**
 * Forgot password success — Figma `#30 Forgot Pass Screen 4` (node 877:4828).
 */
export function ForgotPasswordSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  }, [router]);

  const onLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <View style={styles.root} testID="forgot-password-success-screen">
      <BrandBackground />
      <StatusBar style="light" />

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
            paddingHorizontal: SIDE,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={styles.backButton}
            testID="forgot-success-back"
          >
            <BackArrow height={20} width={20} />
          </Pressable>
          <Text style={styles.title}>Forgot Password</Text>
        </View>

        <View style={styles.badgeWrap} testID="forgot-success-badge">
          <CheckmarkBadge height={BADGE_SIZE} width={BADGE_SIZE} />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.heading} testID="forgot-success-heading">
            Password Successfully Reset
          </Text>
          <Text style={styles.subtitle} testID="forgot-success-subtitle">
            You can now log in with your new password
          </Text>
        </View>

        <View style={styles.spacer} />

        <Button
          label="Login"
          onPress={onLogin}
          style={styles.login}
          testID="forgot-success-login"
          variant="brand"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: FIELD_WIDTH + SIDE * 2,
    alignSelf: 'center',
  },
  header: {
    height: 44,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    left: -0.5,
    top: 4,
    width: 34,
    height: 34,
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 38,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
  /** Artboard y≈69 with header at y≈41 — badge sits just under the title. */
  badgeWrap: {
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignSelf: 'center',
  },
  /** Artboard y≈208 — overlaps lower portion of 160px badge. */
  copyBlock: {
    marginTop: -21,
    width: '100%',
    maxWidth: 325,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 38,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.outlineLabel,
    textAlign: 'center',
    width: '100%',
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  login: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
  },
});
