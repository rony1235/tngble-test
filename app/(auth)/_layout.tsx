import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { useApplicationAuth } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  const router = useRouter();
  const { redirectAfterSignOut, clearRedirectAfterSignOut } = useApplicationAuth();

  // Terms Accept signs out into this stack; land on login (not onboarding index).
  useEffect(() => {
    if (!redirectAfterSignOut) return;
    const href = redirectAfterSignOut;
    clearRedirectAfterSignOut();
    router.replace(href);
  }, [clearRedirectAfterSignOut, redirectAfterSignOut, router]);

  return (
    <View style={styles.root}>
      <BrandBackground />
      <Stack
        screenOptions={{
          animation: Platform.OS === 'ios' ? 'fade' : 'default',
          contentStyle: styles.screen,
          headerShown: false,
        }}
      />
    </View>
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
