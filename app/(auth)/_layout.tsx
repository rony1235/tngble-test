import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { BrandBackground } from '@/components/BrandBackground';
import { colors } from '@/theme/tokens';

export default function AuthLayout() {
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
