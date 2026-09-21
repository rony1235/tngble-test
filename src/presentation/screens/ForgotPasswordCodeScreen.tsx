import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { usePasswordReset } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import { VerificationCodeInput } from '@/presentation/components/VerificationCodeInput';
import { colors, typography } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
/** Figma `#28` shows a 25s resend countdown after send. */
const RESEND_COOLDOWN_MS = 25_000;

/**
 * Forgot password code entry — Figma `#28 Forgot Pass Screen 2` (node 877:4795).
 * Verifies Auth0 Passwordless Email OTP in-app, then opens Screen 3 (new password).
 */
export function ForgotPasswordCodeScreen() {
  const {
    requestPasswordReset,
    confirmPasswordResetOtp,
    isBusy,
    error,
    clearError,
  } = usePasswordReset();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;

  const [code, setCode] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(RESEND_COOLDOWN_MS);
  const cooldownStartedAtRef = useRef(0);
  const confirmingRef = useRef(false);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  useEffect(() => {
    cooldownStartedAtRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - cooldownStartedAtRef.current;
      setCooldownRemainingMs(Math.max(0, RESEND_COOLDOWN_MS - elapsed));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  const startCooldown = useCallback(() => {
    cooldownStartedAtRef.current = Date.now();
    setCooldownRemainingMs(RESEND_COOLDOWN_MS);
  }, []);

  const onResend = useCallback(async () => {
    if (!email || isBusy || cooldownRemainingMs > 0) return;
    clearError();
    setResendSent(false);
    const ok = await requestPasswordReset(email);
    if (ok) {
      setResendSent(true);
      setCode('');
      startCooldown();
    }
  }, [
    clearError,
    cooldownRemainingMs,
    email,
    isBusy,
    requestPasswordReset,
    startCooldown,
  ]);

  const onCodeComplete = useCallback(
    async (value: string) => {
      if (confirmingRef.current || isBusy || !email) return;
      confirmingRef.current = true;
      setIsVerifying(true);
      clearError();
      setResendSent(false);
      try {
        const verified = await confirmPasswordResetOtp(value);
        if (!verified) {
          setCode('');
          return;
        }

        router.replace({
          pathname: '/(auth)/forgot-password-new',
          params: { email },
        });
      } finally {
        setIsVerifying(false);
        confirmingRef.current = false;
      }
    },
    [clearError, confirmPasswordResetOtp, email, isBusy, router],
  );

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/forgot-password');
    }
  }, [router]);

  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const resendDisabled = isBusy || isVerifying || cooldownRemainingMs > 0 || !email;
  const resendLabel =
    cooldownRemainingMs > 0 && !isVerifying
      ? `Resend code in ${cooldownSeconds}s`
      : 'Resend code';
  const buttonLoading = isVerifying || (isBusy && cooldownRemainingMs === 0);

  return (
    <View style={styles.root} testID="forgot-password-code-screen">
      <BrandBackground />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
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
              testID="forgot-code-back"
            >
              <BackArrow height={20} width={20} />
            </Pressable>
            <Text style={styles.title}>Forgot Password</Text>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.copy} testID="forgot-code-message">
              We’ve sent a verification code{' '}
              <Text style={styles.email}>{email ?? 'your email'}</Text>
              {' '}to reset your password
            </Text>
          </View>

          <View style={styles.codeWrap}>
            <VerificationCodeInput
              disabled={isBusy || isVerifying}
              onChange={setCode}
              onComplete={(value) => {
                void onCodeComplete(value);
              }}
              testID="forgot-code"
              value={code}
            />
          </View>

          {resendSent && !error ? (
            <Text style={styles.success} testID="forgot-code-resend-success">
              New code sent. Use only the newest email; earlier codes no longer work.
            </Text>
          ) : null}
          {error ? (
            <ErrorBanner
              detail={error.detail}
              message={error.message}
              testID="forgot-code-error"
            />
          ) : null}

          <Button
            disabled={resendDisabled}
            label={resendLabel}
            loading={buttonLoading}
            onPress={() => {
              void onResend();
            }}
            style={styles.resendButton}
            testID="forgot-code-resend"
            variant="brand"
          />
        </View>
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
  copyBlock: {
    marginTop: 181,
    width: '100%',
    maxWidth: 325,
    alignSelf: 'center',
  },
  copy: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.outlineLabel,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.outlineLabel,
    textDecorationLine: 'underline',
  },
  codeWrap: {
    marginTop: 47,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  success: {
    ...typography.label,
    color: colors.authSuccess,
    textAlign: 'center',
    marginTop: 12,
  },
  resendButton: {
    marginTop: 31,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
  },
});
