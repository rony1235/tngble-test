import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { tryGetAuth0PublicConfig } from '@/infrastructure/config/env';
import { runAuth0AuthorizeSmoke } from '@/infrastructure/auth/auth0Smoke';
import { colors, spacing, typography } from '@/theme/tokens';

type SmokeStatus = 'idle' | 'running' | 'ok' | 'cancelled' | 'error';

/**
 * TEMPORARY Phase 2 device smoke — Universal Login authorize().
 * Visible only in __DEV__ when Auth0 public env is configured.
 * Delete after Auth0Adapter + real auth screens ship.
 */
export function Auth0DevSmokePanel() {
  const configured = tryGetAuth0PublicConfig() != null;
  const [status, setStatus] = useState<SmokeStatus>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  const onPress = useCallback(async () => {
    if (!configured) return;
    setStatus('running');
    setDetail(null);
    try {
      const result = await runAuth0AuthorizeSmoke();
      setStatus('ok');
      setDetail(
        `tokens: access=${result.hasAccessToken ? 'yes' : 'no'} id=${result.hasIdToken ? 'yes' : 'no'} refresh=${result.hasRefreshToken ? 'yes' : 'no'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authorize failed';
      const cancelled =
        /cancel|cancelled|user_cancelled|a0.session.user_cancelled/i.test(message) ||
        (typeof error === 'object' &&
          error != null &&
          'type' in error &&
          String((error as { type?: string }).type).toLowerCase().includes('cancel'));
      setStatus(cancelled ? 'cancelled' : 'error');
      setDetail(cancelled ? 'Browser dismissed' : 'Authorize failed (see Auth0 dashboard / callbacks)');
    }
  }, [configured]);

  if (!__DEV__ || !configured) {
    return null;
  }

  return (
    <View style={styles.wrap} testID="auth0-dev-smoke">
      <Text style={styles.label}>AUTH-01 Phase 2 smoke (dev only)</Text>
      <Button
        disabled={status === 'running'}
        label={status === 'running' ? 'Opening Auth0…' : 'Auth0 authorize smoke'}
        loading={status === 'running'}
        onPress={() => {
          void onPress();
        }}
        testID="auth0-dev-smoke-button"
        variant="ghost"
      />
      {detail ? (
        <Text style={styles.detail} testID="auth0-dev-smoke-detail">
          {status}: {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  detail: {
    ...typography.body,
    color: colors.textMuted,
  },
});
