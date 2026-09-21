import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { useSignUp, useConsentGate } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { validateEmail, validateName, validatePassword } from '@/domain/sanitization';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import { PasswordStrengthMeter } from '@/presentation/components/PasswordStrengthMeter';
import { colors, typography } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
const PROGRESS_ACTIVE = 1;

/**
 * INV-US007 — Figma `#15 Registration Screen 2` (node 523:1347).
 * Email + password Create Account via Auth0 `createUser` + email OTP (INV-US007/009).
 * Terms consent is collected after email verification (Figma T&C step).
 */
export function SignUpScreen() {
  const { signUp, isBusy, error, clearError } = useSignUp();
  const { resetConsent } = useConsentGate();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const submittingRef = useRef(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();

  const formError = fieldError ?? error?.message ?? null;
  const formErrorDetail = fieldError ? undefined : error?.detail;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  // Shared auth error can linger from Login social (e.g. cancelled Google).
  useEffect(() => {
    clearError();
  }, [clearError]);

  const clearMessages = useCallback(() => {
    setFieldError(undefined);
    clearError();
  }, [clearError]);

  const onSubmit = useCallback(async () => {
    if (submittingRef.current || isBusy) return;
    clearMessages();

    const first = validateName(firstName);
    if (!first.ok) {
      setFieldError('Enter a valid first name');
      return;
    }
    const last = validateName(lastName);
    if (!last.ok) {
      setFieldError('Enter a valid last name');
      return;
    }
    const mail = validateEmail(email);
    if (!mail.ok) {
      setFieldError('Enter a valid email address');
      return;
    }
    const pass = validatePassword(password);
    if (!pass.ok) {
      setFieldError(
        pass.error === 'too_short'
          ? 'Password must be at least 8 characters'
          : 'Password is too long',
      );
      return;
    }
    if (password !== confirmPassword) {
      setFieldError('Passwords do not match');
      return;
    }

    submittingRef.current = true;
    try {
      const result = await signUp({
        email: mail.value,
        password: pass.value,
        firstName: first.value,
        lastName: last.value,
      });
      // Fresh signup must collect Terms after OTP, even if this device had prior consent.
      if (result && !result.user.emailVerified) {
        await resetConsent();
      }
    } finally {
      submittingRef.current = false;
    }
  }, [
    clearMessages,
    confirmPassword,
    email,
    firstName,
    isBusy,
    lastName,
    password,
    resetConsent,
    signUp,
  ]);

  return (
    <View style={styles.root} testID="register-screen">
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
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16),
              paddingHorizontal: SIDE,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)');
                }
              }}
              style={styles.backButton}
              testID="register-back"
            >
              <BackArrow height={20} width={20} />
            </Pressable>
            <Text style={styles.title}>Create Account</Text>
          </View>

          <View style={styles.progress} testID="register-progress">
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  index < PROGRESS_ACTIVE
                    ? styles.progressSegmentActive
                    : styles.progressSegmentInactive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.required}>* Required</Text>

          <View style={styles.fields}>
            <TextField
              autoComplete="given-name"
              onChangeText={setFirstName}
              placeholder="First name *"
              returnKeyType="next"
              testID="register-first-name"
              textContentType="givenName"
              value={firstName}
              variant="login"
            />
            <TextField
              autoComplete="family-name"
              onChangeText={setLastName}
              placeholder="Last name *"
              returnKeyType="next"
              testID="register-last-name"
              textContentType="familyName"
              value={lastName}
              variant="login"
            />
            <TextField
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email *"
              returnKeyType="next"
              testID="register-email"
              textContentType="emailAddress"
              value={email}
              variant="login"
            />
            <TextField
              autoComplete="password-new"
              onChangeText={setPassword}
              placeholder="Password *"
              returnKeyType="next"
              secureTextEntry
              testID="register-password"
              textContentType="newPassword"
              value={password}
              variant="login"
            />
            <TextField
              autoComplete="password-new"
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password *"
              returnKeyType="next"
              secureTextEntry
              testID="register-confirm-password"
              textContentType="newPassword"
              value={confirmPassword}
              variant="login"
            />

            <PasswordStrengthMeter password={password} testID="register-password-strength" />

            {formError ? (
              <ErrorBanner
                detail={formErrorDetail}
                message={formError}
                testID="register-error"
              />
            ) : null}
          </View>

          <View style={styles.spacer} />

          <View style={styles.actions}>
            <Button
              disabled={isBusy}
              label="Send Email Verification Code"
              loading={isBusy}
              onPress={() => {
                void onSubmit();
              }}
              testID="register-submit"
              variant="brand"
            />

            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginRow}
              testID="register-to-login"
            >
              <Text style={styles.loginMute}>
                Already have an account?{' '}
                <Text style={styles.loginAccent}>Log in.</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Alias used by the architecture tree (PreAuth ≡ SignUp for AUTH-01). */
export const PreAuthScreen = SignUpScreen;

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
    marginBottom: 7,
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
  progress: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    marginBottom: 30,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1234,
  },
  progressSegmentActive: {
    backgroundColor: colors.brandCTA,
  },
  progressSegmentInactive: {
    backgroundColor: colors.progressInactive,
  },
  required: {
    fontSize: 10,
    fontWeight: '300',
    fontStyle: 'italic',
    lineHeight: 20,
    letterSpacing: -0.06,
    color: colors.licensedText,
    marginBottom: 7,
    width: '100%',
    maxWidth: 224,
  },
  fields: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    gap: 20,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  actions: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
  },
  loginRow: {
    minHeight: 49,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginMute: {
    ...typography.signup,
    color: colors.white,
    textAlign: 'center',
  },
  loginAccent: {
    ...typography.signup,
    color: colors.signupAccent,
  },
});
