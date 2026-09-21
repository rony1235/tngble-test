import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApplicationAuth } from '@/application';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { LicensedBy } from '@/components/LicensedBy';
import { colors, spacing, typography } from '@/theme/tokens';

export function HomeScreen() {
  const { user, signOut, isBusy } = useApplicationAuth();

  return (
    <View style={styles.root} testID="home-screen">
      <BrandBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          {user?.name ? <Text style={styles.name}>{user.name}</Text> : null}
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.hint}>
            Authenticated shell ready. Wallet features will arrive via the backend API.
          </Text>
          <Button
            disabled={isBusy}
            label="Sign out"
            onPress={() => {
              void signOut({ redirectTo: '/(auth)/login' });
            }}
            testID="sign-out"
            variant="ghost"
          />
        </View>
        <LicensedBy style={styles.licensed} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safe: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.white,
  },
  name: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  email: {
    ...typography.body,
    color: colors.brandCTA,
  },
  hint: {
    ...typography.body,
    color: colors.licensedText,
    marginBottom: spacing.lg,
  },
  licensed: {
    paddingBottom: spacing.md,
  },
});
