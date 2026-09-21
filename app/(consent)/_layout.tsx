import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandBackground } from '@/components/BrandBackground';
import { colors } from '@/theme/tokens';

export default function ConsentLayout() {
  return (
    <View style={styles.root}>
      <BrandBackground />
      <Stack
        screenOptions={{
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
