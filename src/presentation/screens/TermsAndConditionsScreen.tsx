import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { useConsentGate, useApplicationAuth } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/shared/constants/legal';
import { colors, radii, typography } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';
import CheckmarkSquare from '../../../assets/auth/checkmark-square.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
/** Figma `#23 T&C` — step 3 of Create Account → OTP → Terms → login. */
const PROGRESS_ACTIVE = 3;

/**
 * INV-US023 — Figma `#23 T&C Screen 4` (node 776:4348).
 * Shown after email verification (and for social when local consent is missing).
 */
export function TermsAndConditionsScreen() {
  const { checked, setConsentChecked, acceptConsent } = useConsentGate();
  const { isAuthenticated, signOut } = useApplicationAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  /** null = follow store `checked`; boolean = user toggled on this screen. */
  const [localAgreed, setLocalAgreed] = useState<boolean | null>(null);
  const agreed = localAgreed ?? checked;
  const [consentError, setConsentError] = useState<string | undefined>();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const goBack = useCallback(() => {
    if (isAuthenticated) {
      void signOut();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/register');
    }
  }, [isAuthenticated, router, signOut]);

  const openExternal = useCallback(async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    }
  }, []);

  const openDocument = useCallback(() => {
    if (isAuthenticated) {
      router.push('/(consent)/terms-document');
      return;
    }
    router.push('/(auth)/terms-document');
  }, [isAuthenticated, router]);

  const onAccept = useCallback(async () => {
    if (!agreed) {
      setConsentError('Agree to the Terms and Conditions to continue');
      return;
    }
    setConsentError(undefined);
    await acceptConsent();
    await setConsentChecked(true);

    // Signup path: Create Account → OTP → Terms → login (skip onboarding).
    if (isAuthenticated) {
      await signOut({ redirectTo: '/(auth)/login' });
      return;
    }

    router.replace('/(auth)/login');
  }, [acceptConsent, agreed, isAuthenticated, router, setConsentChecked, signOut]);

  return (
    <View style={styles.root} testID="terms-screen">
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
            onPress={goBack}
            style={styles.backButton}
            testID="terms-back"
          >
            <BackArrow height={20} width={20} />
          </Pressable>
          <Text style={styles.title}>Terms and Condition</Text>
        </View>

        <View style={styles.progress} testID="terms-progress">
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

        <View style={styles.mid}>
          <Text style={styles.heading}>Read legal disclaimer</Text>
          <Pressable
            accessibilityRole="button"
            onPress={openDocument}
            style={styles.outlineButton}
            testID="terms-view-document"
          >
            <Text style={styles.outlineLabel}>View Terms and Conditions</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            hitSlop={8}
            onPress={() => {
              setConsentError(undefined);
              setLocalAgreed((value) => !(value ?? checked));
            }}
            style={styles.agreeRow}
            testID="terms-agree"
          >
            {agreed ? (
              <View style={styles.boxChecked}>
                <Text style={styles.mark}>✓</Text>
              </View>
            ) : (
              <CheckmarkSquare height={16} width={16} />
            )}
            <Text style={styles.agreeLabel}>I agree to TNGBLE Terms and Conditions</Text>
          </Pressable>

          {consentError ? (
            <Text style={styles.error} testID="terms-error">
              {consentError}
            </Text>
          ) : null}

          <Button
            label="Accept and Continue"
            onPress={() => {
              void onAccept();
            }}
            testID="terms-accept"
            variant="brand"
          />

          <Text style={styles.legalMute}>
            By accepting, you agree to our{'\n'}
            <Text
              onPress={() => {
                void openExternal(TERMS_OF_SERVICE_URL);
              }}
              style={styles.legalLink}
              testID="terms-link-tos"
            >
              Terms of Service
            </Text>
            {' and our '}
            <Text
              onPress={() => {
                void openExternal(PRIVACY_POLICY_URL);
              }}
              style={styles.legalLink}
              testID="terms-link-privacy"
            >
              Privacy Policy.
            </Text>
          </Text>
        </View>
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
  mid: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    gap: 11,
  },
  heading: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 38,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
    maxWidth: 325,
  },
  outlineButton: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.socialBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  outlineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.outlineLabel,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    gap: 14,
    paddingBottom: 8,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
  },
  boxChecked: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.brandCTA,
    borderWidth: 1.5,
    borderColor: colors.brandCTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
  agreeLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.outlineLabel,
  },
  error: {
    ...typography.label,
    color: colors.danger,
    textAlign: 'center',
  },
  legalMute: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.outlineLabel,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 321,
  },
  legalLink: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.outlineLabel,
    textDecorationLine: 'underline',
  },
});
