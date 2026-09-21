import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { BrandBackground } from '@/components/BrandBackground';
import { TERMS_DOCUMENT_BLOCKS } from '@/shared/constants/legal';
import { colors } from '@/theme/tokens';

import BackArrow from '../../../assets/auth/back-arrow.svg';

const SIDE = 16;
const FIELD_WIDTH = 343;
const BODY_WIDTH = 317;

/**
 * Figma `#24 T&C Screen 6` (node 776:4223).
 * Full Terms and Conditions document opened from “View Terms and Conditions”.
 */
export function TermsDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/terms');
  }, [router]);

  return (
    <View style={styles.root} testID="terms-document-screen">
      <BrandBackground />
      <StatusBar style="light" />

      <View
        style={[
          styles.shell,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={goBack}
            style={styles.backButton}
            testID="terms-document-back"
          >
            <BackArrow height={20} width={20} />
          </Pressable>
          <Text style={styles.title}>Terms and condition</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="terms-document-scroll"
        >
          {TERMS_DOCUMENT_BLOCKS.map((block, index) => {
            if (block.type === 'heading') {
              return (
                <Text key={`h-${index}`} style={styles.heading}>
                  {block.text}
                </Text>
              );
            }
            if (block.type === 'bullet') {
              return (
                <View key={`b-${index}`} style={styles.bulletRow}>
                  <Text style={styles.bulletMark}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>{block.label} </Text>
                    {block.text}
                  </Text>
                </View>
              );
            }
            return (
              <Text key={`p-${index}`} style={styles.paragraph}>
                {block.text}
              </Text>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: FIELD_WIDTH + SIDE * 2,
    alignSelf: 'center',
    paddingHorizontal: SIDE,
  },
  header: {
    height: 44,
    width: '100%',
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  backButton: {
    position: 'absolute',
    left: -0.5,
    top: 4,
    width: 34,
    height: 34,
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 38,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    maxWidth: BODY_WIDTH,
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  paragraph: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.077,
    color: colors.outlineLabel,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.091,
    color: colors.outlineLabel,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bulletMark: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.outlineLabel,
    marginTop: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.077,
    color: colors.outlineLabel,
  },
  bulletLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    color: colors.outlineLabel,
  },
});
