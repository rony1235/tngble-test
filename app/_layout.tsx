import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { useApplicationAuth, useConsentGate } from '@/application';
import { AppProviders } from '@/providers';
import { BrandBackground } from '@/components/BrandBackground';
import { injectAutofillStyles } from '@/theme/injectAutofillStyles';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  useEffect(() => {
    injectAutofillStyles();
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  return (
    <View style={styles.root}>
      <BrandBackground />
      <AppProviders>
        <StatusBar style="light" />
        <RootNavigator />
      </AppProviders>
    </View>
  );
}

function RootNavigator() {
  const {
    isAuthenticated,
    isPendingVerification,
    isLoading,
    requiresTermsAcceptance,
  } = useApplicationAuth();
  const { canProceed: hasConsent, ready: consentReady } = useConsentGate();
  const showAuthStack = !isAuthenticated && !isPendingVerification;
  // Post-OTP signup always shows Terms, even if this device already stored consent.
  const showConsentGate =
    isAuthenticated && consentReady && (!hasConsent || requiresTermsAcceptance);
  const showApp =
    isAuthenticated && consentReady && hasConsent && !requiresTermsAcceptance;

  useEffect(() => {
    if (!isLoading) {
      void BootSplash.hide({ fade: true });
    }
  }, [isLoading]);

  if (isLoading || (isAuthenticated && !consentReady)) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.screen,
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={showConsentGate}>
        <Stack.Screen name="(consent)" />
      </Stack.Protected>

      <Stack.Protected guard={isPendingVerification}>
        <Stack.Screen name="(verify)" />
      </Stack.Protected>

      <Stack.Protected guard={showAuthStack}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashBackground,
  },
  screen: {
    backgroundColor: 'transparent',
  },
});
