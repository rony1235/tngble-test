import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { LicensedBy } from '@/components/LicensedBy';
import { colors, spacing, typography } from '@/theme/tokens';

export default function RegisterScreen() {
  return (
    <View style={styles.root} testID="register-screen">
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.body}>
            Account creation will connect to the TNGBLE backend in a later release.
          </Text>
          <Link href="/(auth)/login" style={styles.link} testID="register-to-login">
            Back to Login
          </Link>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.white,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  link: {
    ...typography.label,
    color: colors.paginationActive,
    marginTop: spacing.sm,
  },
  licensed: {
    paddingBottom: spacing.md,
  },
});
