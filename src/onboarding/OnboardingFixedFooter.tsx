import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LicensedBy } from '@/components/LicensedBy';
import { OnboardingPagination } from '@/onboarding/OnboardingPagination';
import type { OnboardingSlide } from '@/onboarding/onboarding.data';
import { colors, radii, typography } from '@/theme/tokens';

type OnboardingFixedFooterProps = {
  style?: StyleProp<ViewStyle>;
  slide: OnboardingSlide;
  slideIndex: number;
  slideCount: number;
  onLogin: () => void;
  onCreateAccount: () => void;
  blurTarget?: RefObject<View | null>;
};

export function OnboardingFixedFooter({
  style,
  slide,
  slideIndex,
  slideCount,
  onLogin,
  onCreateAccount,
  blurTarget,
}: OnboardingFixedFooterProps) {
  const androidBlur = Platform.OS === 'android' && blurTarget;

  return (
    <View style={[styles.panel, style]} testID="onboarding-fixed-footer">
      <BlurView
        blurMethod={androidBlur ? 'dimezisBlurViewSdk31Plus' : 'none'}
        blurTarget={blurTarget}
        intensity={25}
        key={androidBlur ? 'targeted' : 'fallback'}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint="dark"
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.panelBase]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.panelTint]} />

      <OnboardingPagination activeIndex={slideIndex} count={slideCount} />

      <View style={styles.copy} testID="onboarding-copy">
        <Text style={styles.title} testID="onboarding-title">
          {slide.title}
        </Text>
        <Text style={styles.description} testID="onboarding-description">
          {slide.description}
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottomBlock}>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Login"
            accessibilityRole="button"
            onPress={onLogin}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}
            testID="onboarding-login"
          >
            <Text style={styles.primaryLabel}>Login</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Create account"
            accessibilityRole="button"
            onPress={onCreateAccount}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
            testID="onboarding-create-account"
          >
            <Text style={styles.secondaryLabel}>Create account</Text>
          </Pressable>
        </View>

        <LicensedBy style={styles.licensed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  panelBase: {
    backgroundColor: colors.onboardingPanelBase,
  },
  panelTint: {
    backgroundColor: colors.onboardingPanelTint,
  },
  copy: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 289,
    marginTop: 24,
    minHeight: 95,
    gap: 7,
  },
  title: {
    ...typography.onboardingTitle,
    color: colors.white,
    textAlign: 'center',
  },
  description: {
    ...typography.onboardingBody,
    color: colors.white,
    textAlign: 'center',
  },
  spacer: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 16,
  },
  bottomBlock: {
    width: '100%',
  },
  actions: {
    gap: 12,
    width: '100%',
    alignSelf: 'center',
  },
  primaryBtn: {
    height: 48,
    width: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.brandCTA,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  primaryPressed: {
    backgroundColor: colors.brandCTAPressed,
  },
  primaryLabel: {
    ...typography.cta,
    color: colors.white,
    textAlign: 'center',
  },
  secondaryBtn: {
    height: 48,
    width: '100%',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.outlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'transparent',
  },
  secondaryPressed: {
    opacity: 0.75,
  },
  secondaryLabel: {
    ...typography.cta,
    color: colors.outlineLabel,
    textAlign: 'center',
  },
  licensed: {
    marginTop: 25,
    marginBottom: 12,
  },
});
