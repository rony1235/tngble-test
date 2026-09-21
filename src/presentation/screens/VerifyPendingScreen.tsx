import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenCapture from 'expo-screen-capture';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApplicationAuth } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/presentation/components/ErrorBanner';
import { VerificationCodeInput } from '@/presentation/components/VerificationCodeInput';
import { colors, typography } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
/** Create Account → OTP → Terms → login: this is step 2. */
const PROGRESS_ACTIVE = 2;
/** Figma `#19` shows a 25s resend countdown. */
const RESEND_COOLDOWN_MS = 25_000;

/**
 * INV-US009 — Figma `#19 Registration Screen 4` (node 527:1651).
 *
 * Create Account → email OTP (this screen) → Terms → login.
 * Completing the 6-digit code calls `confirmEmailOtp` (no “I’ve verified” CTA).
 */
export function VerifyPendingScreen() {
  const {
    user,
    signOut,
    isBusy,
    resendVerification,
    confirmEmailOtp,
    error,
    clearError,
  } = useApplicationAuth();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(RESEND_COOLDOWN_MS);
  const cooldownStartedAtRef = useRef(0);
  const completingRef = useRef(false);

  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
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
    if (isBusy || isVerifying || cooldownRemainingMs > 0) return;
    clearError();
    setResendSent(false);
    const ok = await resendVerification(user?.email);
    if (ok) {
      setResendSent(true);
      setCode('');
      startCooldown();
    }
  }, [
    clearError,
    cooldownRemainingMs,
    isBusy,
    isVerifying,
    resendVerification,
    startCooldown,
    user?.email,
  ]);

  const onCodeComplete = useCallback(
    async (value: string) => {
      if (completingRef.current || isBusy || isVerifying) return;
      completingRef.current = true;
      setIsVerifying(true);
      clearError();
      setResendSent(false);
      try {
        await confirmEmailOtp(value);
      } finally {
        setIsVerifying(false);
        completingRef.current = false;
      }
    },
    [clearError, confirmEmailOtp, isBusy, isVerifying],
  );

  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const resendDisabled = isBusy || isVerifying || cooldownRemainingMs > 0;
  const resendLabel =
    cooldownRemainingMs > 0 && !isVerifying
      ? `Resend Code in ${cooldownSeconds}s`
      : 'Resend Code';
  const buttonLoading = isVerifying || (isBusy && cooldownRemainingMs === 0);
  const formError = error?.message ?? null;
  const formErrorDetail = error?.detail;

  return (
    <View style={styles.root} testID="verify-pending-screen">
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
              accessibilityLabel="Sign out"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                void signOut();
              }}
              style={styles.backButton}
              testID="verify-sign-out"
            >
              <BackArrow height={20} width={20} />
            </Pressable>
            <Text style={styles.title}>Verify Account</Text>
          </View>

          <View style={styles.progress} testID="verify-progress">
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

          <View style={styles.main}>
            <View style={styles.copyBlock}>
              <Text style={styles.heading}>We’ve sent a verification code to</Text>
              <Text style={styles.email} testID="verify-message">
                {user?.email ?? 'your email'}
              </Text>
            </View>

            <View style={styles.codeWrap}>
              <VerificationCodeInput
                disabled={isBusy || isVerifying}
                onChange={setCode}
                onComplete={(value) => {
                  void onCodeComplete(value);
                }}
                testID="verify-code"
                value={code}
              />
            </View>

            {resendSent && !error ? (
              <Text style={styles.success} testID="verify-resend-success">
                New code sent. Use only the newest email; earlier codes no longer work.
              </Text>
            ) : null}
            {formError ? (
              <ErrorBanner
                detail={formErrorDetail}
                message={formError}
                testID="verify-error"
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
              testID="verify-resend"
              variant="brand"
            />
          </View>
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
  progress: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    marginBottom: 0,
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
  /** Figma: copy + OTP + resend centered in the space below the progress bar. */
  main: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBlock: {
    width: '100%',
    maxWidth: 325,
    marginBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
    color: colors.white,
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    color: '#9C9C9C',
  },
  codeWrap: {
    width: '100%',
    alignItems: 'center',
  },
  success: {
    ...typography.label,
    color: colors.authSuccess,
    marginTop: 12,
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 31,
    alignSelf: 'center',
    width: '100%',
    maxWidth: FIELD_WIDTH,
  },
});
