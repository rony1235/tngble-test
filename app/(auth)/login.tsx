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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { AuthConfirmationSheet } from '@/auth/AuthConfirmationSheet';
import { useAuth } from '@/auth/AuthProvider';
import type { AuthProviderType } from '@/auth/auth-sheet.types';
import {
  ACTIONS_TOP,
  FORM_BLOCK_HEIGHT,
  FORM_TOP,
  LOGO_HEIGHT,
  LOGO_TOP,
  LOGO_WIDTH,
} from '@/auth/login.layout';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { SocialAuthButton } from '@/components/SocialAuthButton';
import { TextField } from '@/components/TextField';
import { DESIGN_HEIGHT, DESIGN_WIDTH, STATUS_BAR_HEIGHT } from '@/theme/layout';
import { colors, spacing, typography } from '@/theme/tokens';

const LOGO = require('../../assets/brand/tngble-logo.png');
const FACE_ID = require('../../assets/auth/face-id.png');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIDE_MARGIN_RATIO = 0.043;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = windowWidth / DESIGN_WIDTH;
  const heightScale = windowHeight / DESIGN_HEIGHT;
  const sidePadding = Math.max(16, Math.round(windowWidth * SIDE_MARGIN_RATIO));

  const passwordRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authSheet, setAuthSheet] = useState<AuthProviderType | null>(null);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const logoWidth = LOGO_WIDTH * scale;
  const logoHeight = LOGO_HEIGHT * scale;

  const logoTop = insets.top + (LOGO_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const logoToFormGap = (FORM_TOP - LOGO_TOP - LOGO_HEIGHT) * heightScale;
  const desiredActionsTop = insets.top + (ACTIONS_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const usedAboveActions = logoTop + logoHeight + logoToFormGap + FORM_BLOCK_HEIGHT;
  const formToActionsMinGap = Math.max(24, desiredActionsTop - usedAboveActions);

  const validate = useCallback(() => {
    const nextEmail = email.trim();
    let ok = true;

    if (!nextEmail) {
      setEmailError('Email is required');
      ok = false;
    } else if (!EMAIL_PATTERN.test(nextEmail)) {
      setEmailError('Enter a valid email address');
      ok = false;
    } else {
      setEmailError(undefined);
    }

    if (!password) {
      setPasswordError('Password is required');
      ok = false;
    } else {
      setPasswordError(undefined);
    }

    return ok;
  }, [email, password]);

  async function onSubmit() {
    if (submittingRef.current || loading) return;
    setFormError(null);
    if (!validate()) return;

    submittingRef.current = true;
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const openAuthSheet = useCallback((provider: AuthProviderType) => {
    setFormError(null);
    setAuthSheet(provider);
  }, []);

  const onSheetAuthenticated = useCallback(
    async (credentials: { email: string; password: string }) => {
      await signIn(credentials);
      setAuthSheet(null);
    },
    [signIn],
  );

  return (
    <View style={styles.root} testID="login-screen">
      <BrandBackground />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents={authSheet ? 'none' : 'auto'}
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
                ref={passwordRef}
                returnKeyType="done"
                secureTextEntry
                testID="login-password"
                textContentType="password"
                trailing={
                  <Pressable
                    accessibilityLabel="Sign in with Face ID"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => openAuthSheet('faceId')}
                    testID="login-face-id"
                  >
                    <Image
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                      resizeMode="contain"
                      source={FACE_ID}
                      style={styles.faceId}
                    />
                  </Pressable>
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
              <Text style={styles.formError} testID="login-error">
                {formError}
              </Text>
            ) : null}
          </View>

          <View style={[styles.spacer, { minHeight: formToActionsMinGap }]} />

          <View style={styles.actions}>
            <View style={styles.actionButtons}>
              <Button
                disabled={loading}
                label="Login"
                loading={loading}
                onPress={() => {
                  void onSubmit();
                }}
                testID="login-submit"
                variant="brand"
              />

              <SocialAuthButton
                label="Continue with Apple"
                onPress={() => openAuthSheet('apple')}
                provider="apple"
                testID="login-apple"
              />

              <SocialAuthButton
                label="Continue with Google"
                onPress={() => openAuthSheet('google')}
                provider="google"
                testID="login-google"
              />
            </View>

            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/(auth)/register')}
              style={styles.signupRow}
              testID="login-signup"
            >
              <Text style={styles.signupMute}>
                Don’t have an  account?{' '}
                <Text style={styles.signupAccent}>Sign up.</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AuthConfirmationSheet
        onAuthenticated={onSheetAuthenticated}
        onDismiss={() => setAuthSheet(null)}
        provider={authSheet}
      />
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
  },
  faceId: {
    width: 18,
    height: 19,
  },
  forgotWrap: {
    width: '94%',
    maxWidth: 323,
    alignSelf: 'flex-start',
  },
  forgot: {
    ...typography.forgot,
    color: colors.licensedText,
    textAlign: 'right',
  },
  formError: {
    ...typography.label,
    color: colors.danger,
    marginTop: spacing.xs,
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
