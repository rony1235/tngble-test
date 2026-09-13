import { Image, StyleSheet, View } from 'react-native';

import { HERO_TOP } from '@/onboarding/layout';
import type { OnboardingSlide as Slide } from '@/onboarding/onboarding.data';
import { DESIGN_WIDTH } from '@/theme/layout';

type OnboardingSlideViewProps = {
  slide: Slide;
  width: number;
  height: number;
  sharpClipHeight: number;
  heroScale?: number;
};

export function OnboardingSlideView({
  slide,
  width,
  height,
  sharpClipHeight,
  heroScale = 1,
}: OnboardingSlideViewProps) {
  const scale = width / DESIGN_WIDTH;
  const heroWidth = slide.heroWidth * scale * heroScale;
  const heroHeight = slide.heroHeight * scale * heroScale;
  const designCenterX = (slide.heroLeft + slide.heroWidth / 2) * scale;
  const heroLeft = designCenterX - heroWidth / 2;
  const heroTop = Math.max(0, (slide.heroTop - HERO_TOP) * scale);
  const clip = Math.max(0, Math.min(sharpClipHeight, height));

  const heroStyle = {
    position: 'absolute' as const,
    left: heroLeft,
    width: heroWidth,
    height: heroHeight,
  };

  return (
    <View style={[styles.slide, { width, height }]} testID={`onboarding-slide-${slide.id}`}>
      <View style={[styles.sharpBand, { height: clip }]}>
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no"
          resizeMode="contain"
          source={slide.artwork}
          style={[heroStyle, { top: heroTop }]}
          testID={`onboarding-hero-${slide.id}`}
        />
      </View>

      <View style={styles.blurBand}>
        <Image
          accessibilityElementsHidden
          blurRadius={10}
          importantForAccessibility="no"
          resizeMode="contain"
          source={slide.artwork}
          style={[heroStyle, { top: heroTop - clip }]}
          testID={`onboarding-hero-blur-${slide.id}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    overflow: 'hidden',
  },
  sharpBand: {
    width: '100%',
    overflow: 'hidden',
  },
  blurBand: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
