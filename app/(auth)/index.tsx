import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { BrandBackground } from '@/components/BrandBackground';
import { OnboardingCarousel } from '@/onboarding/OnboardingCarousel';
import { colors } from '@/theme/tokens';

export default function OnboardingScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const go = useCallback(
    (href: '/(auth)/login' | '/(auth)/register') => {
      if (busy) return;
      setBusy(true);
      router.replace(href);
      setBusy(false);
    },
    [busy, router],
  );

  return (
    <View style={styles.root} testID="onboarding-screen">
      <BrandBackground />
      <StatusBar style="light" />
      <View style={styles.content}>
        <OnboardingCarousel
          onCreateAccount={() => go('/(auth)/register')}
          onLogin={() => go('/(auth)/login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashBackground,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
