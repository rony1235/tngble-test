import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { useSignIn, useSocialSignIn } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { SocialProvider } from '@/domain/auth';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import { SocialAuthButtons } from '@/presentation/components/SocialAuthButtons';
import {
  ACTIONS_TOP,
  FORM_BLOCK_HEIGHT,
  FORM_TOP,
  LOGO_HEIGHT,
  LOGO_TOP,
  LOGO_WIDTH,
  SIDE_MARGIN_RATIO,
} from '@/presentation/screens/authLayout';
import { requireValidEmail } from '@/presentation/utils/emailField';
import { DESIGN_HEIGHT, DESIGN_WIDTH, STATUS_BAR_HEIGHT } from '@/theme/layout';
import { colors, typography } from '@/theme/tokens';

import FaceIdIcon from '../../../assets/auth/face.svg';

const LOGO = require('../../../assets/brand/tngble-logo.png');

function isIosSimulator(): boolean {
  if (Platform.OS !== 'ios') return false;
  return Constants.platform?.ios?.simulator === true;
}

/**
 * Sign-in — Figma `#8 Sign-In Screen 1` (node 507:552).
 * Email + password required for native Password Grant login.
 * Face ID icon is visual only (INV-E03).
 */
export function SignInScreen() {
  const { signIn, isBusy: signInBusy, error: signInError, clearError } = useSignIn();
  const {
    signInWithSocial,
    isBusy: socialBusy,
    error: socialError,
    clearError: clearSocialError,
  } = useSocialSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = windowWidth / DESIGN_WIDTH;
  const heightScale = windowHeight / DESIGN_HEIGHT;
  const sidePadding = Math.max(16, Math.round(windowWidth * SIDE_MARGIN_RATIO));

  const submittingRef = useRef(false);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = signInBusy || socialBusy;
  const formError = localError ?? signInError?.message ?? socialError?.message ?? null;
  const formErrorDetail = localError ? undefined : signInError?.detail ?? socialError?.detail;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  // Drop leftover errors from another screen once on mount only.
  // Do not depend on `busy` — when social/login finishes, busy goes false and
  // that would immediately wipe the error that was just set.
  useEffect(() => {
    clearError();
    clearSocialError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only clear
  }, []);

  const logoWidth = LOGO_WIDTH * scale;
  const logoHeight = LOGO_HEIGHT * scale;
  const logoTop = insets.top + (LOGO_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const logoToFormGap = (FORM_TOP - LOGO_TOP - LOGO_HEIGHT) * heightScale;
  const desiredActionsTop = insets.top + (ACTIONS_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const usedAboveActions = logoTop + logoHeight + logoToFormGap + FORM_BLOCK_HEIGHT;
  const formToActionsMinGap = Math.max(24, desiredActionsTop - usedAboveActions);

  const clearMessages = useCallback(() => {
    setLocalError(null);
    clearError();
    clearSocialError();
  }, [clearError, clearSocialError]);

  const onSubmit = useCallback(async () => {
    if (submittingRef.current || busy) return;
    clearMessages();

    const emailResult = requireValidEmail(email);
    const missingPassword = password.trim().length === 0;

    if ('error' in emailResult) {
      setEmailError(emailResult.error);
    } else {
      setEmailError(undefined);
    }

    if (missingPassword) {
      setPasswordError('Enter your password');
    } else {
      setPasswordError(undefined);
    }

    if ('error' in emailResult || missingPassword) {
      return;
    }

    submittingRef.current = true;
    try {
      await signIn({ email: emailResult.email, password });
    } finally {
      submittingRef.current = false;
    }
  }, [busy, clearMessages, email, password, signIn]);

  const onSocial = useCallback(
    async (provider: SocialProvider) => {
      if (busy) return;
      clearMessages();
      // Appetize / iOS Simulator cannot complete ASWebAuthenticationSession callbacks.
      if (isIosSimulator()) {
        setLocalError('Apple/Google sign-in needs a real iPhone. Use email and password here.');
        return;
      }
      await signInWithSocial(provider);
    },
    [busy, clearMessages, signInWithSocial],
  );

  return (
    <View style={styles.root} testID="login-screen">
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
                marginBottom: logoToFormGap,
              },
            ]}
            testID="login-logo"
          />

          <View style={styles.formBlock}>
            <View style={styles.heading}>
              <Text style={styles.welcome}>Welcome</Text>
              <Text style={styles.subtitle} testID="login-subtitle">
                Please enter your registered email address
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
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="Email *"
                returnKeyType="next"
                testID="login-email"
                textContentType="emailAddress"
                value={email}
                variant="login"
              />

              <TextField
                ref={passwordRef}
                autoComplete="password"
                error={passwordError}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(undefined);
                }}
                onSubmitEditing={() => {
                  void onSubmit();
                }}
                placeholder="Password*"
                returnKeyType="go"
                secureTextEntry
                testID="login-password"
                textContentType="password"
                trailing={
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    style={styles.faceId}
                    testID="login-face-id"
                  >
                    <FaceIdIcon height={19} width={18} />
                  </View>
                }
                value={password}
                variant="login"
              />
            </View>

            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotWrap}
              testID="login-forgot-password"
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>

            {formError ? (
              <ErrorBanner
                detail={formErrorDetail}
                message={formError}
                testID="login-error"
              />
            ) : null}
          </View>

          <View style={[styles.spacer, { minHeight: formToActionsMinGap }]} />

          <View style={styles.actions}>
            <View style={styles.actionButtons}>
              <Button
                disabled={busy}
                label="Login"
                loading={busy}
                onPress={() => {
                  void onSubmit();
                }}
                testID="login-submit"
                variant="brand"
              />

              <SocialAuthButtons disabled={busy} onPress={(provider) => void onSocial(provider)} />
            </View>

            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/(auth)/register')}
              style={styles.signupRow}
              testID="login-signup"
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
  formBlock: {
    width: '100%',
    gap: 7,
  },
  heading: {
    width: '100%',
    maxWidth: 289,
    minHeight: 84,
    justifyContent: 'flex-start',
  },
  welcome: {
    ...typography.welcome,
    color: colors.white,
    width: '100%',
    textAlign: 'left',
  },
  subtitle: {
    ...typography.welcomeSubtitle,
    color: colors.licensedText,
    width: '100%',
    textAlign: 'left',
  },
  fields: {
    gap: 20,
    width: '100%',
    height: 116,
  },
  faceId: {
    width: 18,
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** Figma `527:1867` — 323×20, directly under fields, label right-aligned. */
  forgotWrap: {
    width: 323,
    maxWidth: '100%',
    height: 20,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  forgot: {
    ...typography.forgot,
    color: colors.licensedText,
    textAlign: 'right',
    width: '100%',
  },
  spacer: {
    flexGrow: 1,
  },
  actions: {
    width: '100%',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  signupRow: {
    minHeight: 49,
    paddingTop: 16,
    paddingBottom: 20,
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
