import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { usePasswordReset } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { validatePassword } from '@/domain/sanitization';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import { colors } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
/** Figma `#29` — copy starts at y=208 under the header (y=41, h=38). */
const COPY_TOP_GAP = 129;
/** Figma fields (y=292) sit 24px under the 60px copy block. */
const FIELDS_TOP_GAP = 24;
/** Figma Proceed (y=437) sits 29px under the 116px field stack. */
const PROCEED_TOP_GAP = 29;

/**
 * Forgot password — set new password.
 * Figma `#29 Forgot Pass Screen 3` (node 877:4816) plus layers
 * `877:4846` (copy) / `877:4850` (fields) / `877:4827` (Proceed).
 *
 * Requires a prior Passwordless OTP confirm; sets the DB password in-app via
 * Auth0 My Account API (`completePasswordReset`) — no custom backend.
 */
export function ForgotPasswordNewScreen() {
  const { completePasswordReset, isBusy, error, clearError } = usePasswordReset();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    email?: string | string[];
    code?: string | string[];
  }>();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;

  const confirmRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/(auth)/forgot-password-code',
        params: email ? { email } : undefined,
      });
    }
  }, [email, router]);

  const onProceed = useCallback(async () => {
    if (submittingRef.current || isBusy) return;
    setFieldError(undefined);
    clearError();

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
      const ok = await completePasswordReset(pass.value);
      if (ok) {
        router.push({
          pathname: '/(auth)/forgot-password-success',
          params: email ? { email } : undefined,
        });
      }
    } finally {
      submittingRef.current = false;
    }
  }, [
    clearError,
    completePasswordReset,
    confirmPassword,
    email,
    isBusy,
    password,
    router,
  ]);

  const formError = fieldError ?? error?.message ?? null;
  const formErrorDetail = fieldError ? undefined : error?.detail;

  return (
    <View style={styles.root} testID="forgot-password-new-screen">
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
              onPress={onBack}
              style={styles.backButton}
              testID="forgot-new-back"
            >
              <BackArrow height={20} width={20} />
            </Pressable>
            <Text style={styles.title}>Forgot Password</Text>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.heading} testID="forgot-new-heading">
              Email successfully verified
            </Text>
            <Text style={styles.subtitle} testID="forgot-new-subtitle">
              Enter a New Password
            </Text>
          </View>

          <View style={styles.fields}>
            <TextField
              autoComplete="password-new"
              onChangeText={(value) => {
                setPassword(value);
                if (fieldError) setFieldError(undefined);
              }}
              onSubmitEditing={() => confirmRef.current?.focus()}
              placeholder="Password *"
              returnKeyType="next"
              secureTextEntry
              testID="forgot-new-password"
              textContentType="newPassword"
              value={password}
              variant="login"
            />
            <TextField
              ref={confirmRef}
              autoComplete="password-new"
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (fieldError) setFieldError(undefined);
              }}
              onSubmitEditing={() => {
                void onProceed();
              }}
              placeholder="Confirm Password *"
              returnKeyType="go"
              secureTextEntry
              testID="forgot-new-confirm"
              textContentType="newPassword"
              value={confirmPassword}
              variant="login"
            />
          </View>

          {formError ? (
            <ErrorBanner
              detail={formErrorDetail}
              message={formError}
              testID="forgot-new-error"
            />
          ) : null}

          <Button
            disabled={isBusy}
            label="Proceed"
            loading={isBusy}
            onPress={() => {
              void onProceed();
            }}
            style={styles.proceed}
            testID="forgot-new-proceed"
            variant="brand"
          />
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
  copyBlock: {
    marginTop: COPY_TOP_GAP,
    width: '100%',
    maxWidth: 325,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 38,
    color: colors.white,
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.outlineLabel,
    width: '100%',
  },
  fields: {
    marginTop: FIELDS_TOP_GAP,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    gap: 20,
  },
  /** Figma `877:4827` — pill CTA at y=437, not pinned to the bottom. */
  proceed: {
    marginTop: PROCEED_TOP_GAP,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    height: 48,
    minHeight: 48,
    borderRadius: 78,
    backgroundColor: colors.brandCTA,
    paddingHorizontal: 32,
  },
});
