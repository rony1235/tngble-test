import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AUTH_SHEET_MOCK_PASSWORD,
  AUTH_SHEET_MOCK_USER,
  AUTH_SHEETS,
} from '@/auth/auth-sheet.data';
import type { AuthProviderType, AuthSheetStatus } from '@/auth/auth-sheet.types';
import { AuthAccountCard } from '@/auth/AuthAccountCard';
import { AuthProviderIcon } from '@/auth/AuthProviderIcon';
import { AuthSigningStatus } from '@/auth/AuthSigningStatus';
import { BrandBackground } from '@/components/BrandBackground';
import { Button } from '@/components/Button';
import { DESIGN_WIDTH } from '@/theme/layout';
import { colors, spacing, typography } from '@/theme/tokens';

const OPEN_MS = 280;
const CONNECT_MS = 650;
const SUCCESS_HOLD_MS = 700;
const FACE_CONNECT_MS = 500;

type AuthConfirmationSheetProps = {
  provider: AuthProviderType | null;
  onDismiss: () => void;
  onAuthenticated: (credentials: { email: string; password: string }) => Promise<void>;
};

export function AuthConfirmationSheet({
  provider,
  onDismiss,
  onAuthenticated,
}: AuthConfirmationSheetProps) {
  const visible = provider != null;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, 480);
  const scale = contentWidth / DESIGN_WIDTH;

  const [status, setStatus] = useState<AuthSheetStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(420)).current;
  const connectingRef = useRef(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const animateOpen = useCallback(() => {
    if (process.env.JEST_WORKER_ID) {
      overlayOpacity.setValue(1);
      sheetTranslate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: OPEN_MS,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslate, {
        toValue: 0,
        duration: OPEN_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sheetTranslate]);

  const animateClose = useCallback(
    (after?: () => void) => {
      if (process.env.JEST_WORKER_ID) {
        overlayOpacity.setValue(0);
        sheetTranslate.setValue(420);
        after?.();
        return;
      }
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslate, {
          toValue: 420,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) after?.();
      });
    },
    [overlayOpacity, sheetTranslate],
  );

  const resetState = useCallback(() => {
    clearTimers();
    connectingRef.current = false;
    completedRef.current = false;
    setStatus('ready');
    setError(null);
  }, [clearTimers]);

  const requestDismiss = useCallback(() => {
    if (status === 'connecting' || status === 'success') return;
    animateClose(() => {
      onDismiss();
    });
  }, [animateClose, onDismiss, status]);

  useEffect(() => {
    if (!provider) {
      setMounted(false);
      resetState();
      overlayOpacity.setValue(0);
      sheetTranslate.setValue(420);
      return;
    }

    resetState();
    setMounted(true);
    overlayOpacity.setValue(0);
    sheetTranslate.setValue(420);
    requestAnimationFrame(() => animateOpen());
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearTimers();
      overlayOpacity.stopAnimation();
      sheetTranslate.stopAnimation();
    };
  }, [clearTimers, overlayOpacity, sheetTranslate]);

  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestDismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible, requestDismiss]);

  const finishAuth = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      await onAuthenticated({
        email: AUTH_SHEET_MOCK_USER.email,
        password: AUTH_SHEET_MOCK_PASSWORD,
      });
    } catch (err) {
      completedRef.current = false;
      connectingRef.current = false;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    }
  }, [onAuthenticated]);

  const runConnectFlow = useCallback(() => {
    if (connectingRef.current || !provider) return;
    connectingRef.current = true;
    setError(null);
    setStatus('connecting');

    const t1 = setTimeout(() => {
      setStatus('success');
      const t2 = setTimeout(() => {
        void finishAuth();
      }, SUCCESS_HOLD_MS);
      timersRef.current.push(t2);
    }, provider === 'faceId' ? FACE_CONNECT_MS : CONNECT_MS);
    timersRef.current.push(t1);
  }, [finishAuth, provider]);

  useEffect(() => {
    if (!provider) return;
    if (!AUTH_SHEETS[provider].autoStart) return;
    const t = setTimeout(() => {
      runConnectFlow();
    }, 350);
    timersRef.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  if (!mounted || !provider) return null;

  const config = AUTH_SHEETS[provider];
  const sheetHeight = config.sheetHeight * scale + Math.max(insets.bottom - 8, 0);
  const canDismiss = status === 'ready' || status === 'error';

  return (
    <Modal
      animationType="none"
      onRequestClose={requestDismiss}
      statusBarTranslucent
      transparent
      visible={mounted}
    >
      <View style={styles.root} testID={`auth-sheet-${provider}`}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable
            accessibilityLabel="Dismiss sign in"
            disabled={!canDismiss}
            onPress={requestDismiss}
            style={StyleSheet.absoluteFill}
            testID="auth-sheet-overlay"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              maxWidth: contentWidth,
              width: '100%',
              alignSelf: 'center',
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslate }],
            },
          ]}
          testID="auth-sheet-panel"
        >
          <BrandBackground crop="top" />

          <View
            style={[
              styles.content,
              provider === 'faceId' ? styles.contentFace : null,
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>
            </View>

            <View
              style={[
                styles.iconSlot,
                provider === 'faceId' ? styles.faceIconSlot : null,
              ]}
            >
              <AuthProviderIcon provider={provider} />
            </View>

            {config.description ? (
              <Text style={styles.description}>{config.description}</Text>
            ) : null}

            {config.showsAccount ? (
              <View style={styles.accountWrap}>
                <AuthAccountCard user={AUTH_SHEET_MOCK_USER} />
              </View>
            ) : null}

            <View
              style={[
                styles.footer,
                config.showsConnect ? styles.footerSocial : styles.footerFace,
              ]}
            >
              {status === 'error' ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.errorText} testID="auth-sheet-error">
                    {error ?? 'Unable to sign in. Please try again.'}
                  </Text>
                  {config.showsConnect ? (
                    <Button
                      label="Connect"
                      onPress={runConnectFlow}
                      style={styles.connect}
                      testID="auth-sheet-connect"
                      variant="brand"
                    />
                  ) : (
                    <Button
                      label="Try again"
                      onPress={runConnectFlow}
                      style={styles.connect}
                      testID="auth-sheet-retry"
                      variant="brand"
                    />
                  )}
                </View>
              ) : null}

              {status === 'ready' && config.showsConnect ? (
                <Button
                  label="Connect"
                  onPress={runConnectFlow}
                  style={styles.connect}
                  testID="auth-sheet-connect"
                  variant="brand"
                />
              ) : null}

              {status === 'connecting' && config.showsConnect ? (
                <Button
                  label="Connect"
                  loading
                  style={styles.connect}
                  testID="auth-sheet-connect"
                  variant="brand"
                />
              ) : null}

              {status === 'success' ? <AuthSigningStatus /> : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.authOverlayDim,
  },
  sheet: {
    backgroundColor: colors.splashBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  contentFace: {
    justifyContent: 'flex-start',
  },
  header: {
    width: '100%',
    maxWidth: 325,
    alignItems: 'center',
  },
  title: {
    ...typography.authSheetTitle,
    color: colors.outlineLabel,
    textAlign: 'center',
    width: '100%',
    marginBottom: -3,
  },
  subtitle: {
    ...typography.authSheetSubtitle,
    color: colors.outlineLabel,
    textAlign: 'center',
    width: '100%',
    maxWidth: 303,
  },
  iconSlot: {
    width: '100%',
    maxWidth: 325,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  faceIconSlot: {
    height: undefined,
    minHeight: 66,
    marginTop: 39,
    padding: 0,
  },
  description: {
    ...typography.authSheetSubtitle,
    color: colors.outlineLabel,
    textAlign: 'center',
    width: '100%',
    maxWidth: 325,
  },
  accountWrap: {
    width: '100%',
    maxWidth: 343,
    marginTop: 18,
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    maxWidth: 343,
    alignItems: 'center',
    paddingBottom: spacing.xs,
    minHeight: 72,
    justifyContent: 'flex-end',
  },
  footerSocial: {
    marginTop: 24,
  },
  footerFace: {
    marginTop: 24,
    minHeight: 80,
    justifyContent: 'flex-start',
  },
  connect: {
    width: '100%',
    alignSelf: 'stretch',
  },
  errorBlock: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    ...typography.label,
    color: colors.danger,
    textAlign: 'center',
  },
});
