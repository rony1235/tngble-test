import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { usePasswordReset } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import {
  LOGO_HEIGHT,
  LOGO_TOP,
  LOGO_WIDTH,
  SIDE_MARGIN_RATIO,
} from '@/presentation/screens/authLayout';
import { requireValidEmail } from '@/presentation/utils/emailField';
import { DESIGN_HEIGHT, DESIGN_WIDTH, STATUS_BAR_HEIGHT } from '@/theme/layout';
import { colors, typography } from '@/theme/tokens';

const LOGO = require('../../../assets/brand/tngble-logo.png');

/** Figma `#27 Forgot Pass Screen 1` (node 877:4771) — 375×812. */
const HEADING_TOP = 165;
const FIELD_TOP = 264;
const ACTIONS_TOP = 622;
const HEADING_BLOCK_HEIGHT = 64;
const FIELD_BLOCK_HEIGHT = 48;

/**
 * Forgot password — Figma `#27 Forgot Pass Screen 1` (node 877:4771).
 * On success navigates to `#28` code screen with the submitted email.
 */
export function ForgotPasswordScreen() {
  const { requestPasswordReset, isBusy, error, clearError } = usePasswordReset();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = windowWidth / DESIGN_WIDTH;
  const heightScale = windowHeight / DESIGN_HEIGHT;
  const sidePadding = Math.max(16, Math.round(windowWidth * SIDE_MARGIN_RATIO));

  const submittingRef = useRef(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const logoWidth = LOGO_WIDTH * scale;
  const logoHeight = LOGO_HEIGHT * scale;
  const logoTop = insets.top + (LOGO_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const logoToHeadingGap = (HEADING_TOP - LOGO_TOP - LOGO_HEIGHT) * heightScale;
  const headingToFieldGap = (FIELD_TOP - HEADING_TOP - HEADING_BLOCK_HEIGHT) * heightScale;
  const desiredActionsTop = insets.top + (ACTIONS_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const usedAboveActions =
    logoTop + logoHeight + logoToHeadingGap + HEADING_BLOCK_HEIGHT + headingToFieldGap + FIELD_BLOCK_HEIGHT;
  const formToActionsMinGap = Math.max(24, desiredActionsTop - usedAboveActions);

  const onSubmit = useCallback(async () => {
    if (submittingRef.current || isBusy) return;
    clearError();

    const validated = requireValidEmail(email);
    if ('error' in validated) {
      setEmailError(validated.error);
      return;
    }
    setEmailError(undefined);

    submittingRef.current = true;
    try {
      const ok = await requestPasswordReset(validated.email);
      // Success (including swallowed enumeration errors) advances to code UI.
      // Network / rate-limit failures surface via `error` only — never imply delivery.
      if (ok) {
        router.push({
          pathname: '/(auth)/forgot-password-code',
          params: { email: validated.email },
        });
      }
    } finally {
      submittingRef.current = false;
    }
  }, [clearError, email, isBusy, requestPasswordReset, router]);

  return (
    <View style={styles.root} testID="forgot-password-screen">
      <BrandBackground />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: logoTop,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingHorizontal: sidePadding,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            accessibilityLabel="TNGBLE"
            resizeMode="contain"
            source={LOGO}
            style={[
              styles.logo,
              {
                width: logoWidth,
                height: logoHeight,
                marginBottom: logoToHeadingGap,
              },
            ]}
            testID="forgot-logo"
          />

          <View style={[styles.heading, { marginBottom: headingToFieldGap }]}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.body} testID="forgot-subtitle">
              Please enter your email address to reset your password.
            </Text>
          </View>

          <View style={styles.fields}>
            <TextField
              autoComplete="email"
              error={emailError}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
              }}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              placeholder="Email *"
              returnKeyType="go"
              testID="forgot-email"
              textContentType="emailAddress"
              value={email}
              variant="login"
            />

            {error ? (
              <ErrorBanner detail={error.detail} message={error.message} testID="forgot-error" />
            ) : null}
          </View>

          <View style={[styles.spacer, { minHeight: formToActionsMinGap }]} />

          <View style={styles.actions}>
            <Button
              disabled={isBusy}
              label="Reset Password"
              loading={isBusy}
              onPress={() => {
                void onSubmit();
              }}
              testID="forgot-submit"
              variant="brand"
            />

            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/(auth)/register')}
              style={styles.signupRow}
              testID="forgot-signup"
            >
              <Text style={styles.signupMute}>
                Don’t have an account?{' '}
                <Text style={styles.signupAccent}>Sign up.</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logo: {
    alignSelf: 'center',
  },
  heading: {
    width: '100%',
    maxWidth: 333,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 38,
    color: colors.white,
    width: '100%',
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.outlineLabel,
    width: '100%',
  },
  fields: {
    width: '100%',
    gap: 12,
  },
  spacer: {
    flexGrow: 1,
  },
  actions: {
    width: '100%',
  },
  signupRow: {
    minHeight: 49,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupMute: {
    ...typography.signup,
    color: colors.white,
    textAlign: 'center',
  },
  signupAccent: {
    ...typography.signup,
    color: colors.signupAccent,
  },
});
