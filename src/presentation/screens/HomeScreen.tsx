import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApplicationAuth } from '@/application';
import { Button } from '@/components/Button';
import { LicensedBy } from '@/components/LicensedBy';
import { colors, spacing, typography } from '@/theme/tokens';

export function HomeScreen() {
  const { user, signOut, isBusy } = useApplicationAuth();

  return (
    <SafeAreaView style={styles.safe} testID="home-screen">
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
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  email: {
    ...typography.body,
    color: colors.primary,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  licensed: {
    paddingBottom: spacing.md,
  },
});
