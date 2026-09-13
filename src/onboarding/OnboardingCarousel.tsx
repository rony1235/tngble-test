import { BlurTargetView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { OnboardingFixedFooter } from '@/onboarding/OnboardingFixedFooter';
import { OnboardingSlideView } from '@/onboarding/OnboardingSlideView';
import {
  HERO_SCALE,
  HERO_TOP,
  LOGO_HEIGHT,
  LOGO_TOP,
  LOGO_WIDTH,
  PANEL_TOP,
} from '@/onboarding/layout';
import {
  ONBOARDING_SLIDE_COUNT,
  ONBOARDING_SLIDES,
  type OnboardingSlide,
} from '@/onboarding/onboarding.data';
import { DESIGN_HEIGHT, DESIGN_WIDTH, STATUS_BAR_HEIGHT } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const LOGO = require('../../assets/brand/tngble-logo.png');

type OnboardingCarouselProps = {
  onLogin: () => void;
  onCreateAccount: () => void;
};

export function OnboardingCarousel({ onLogin, onCreateAccount }: OnboardingCarouselProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pageWidth = Math.min(windowWidth, 480);
  const scale = pageWidth / DESIGN_WIDTH;
  const heightScale = windowHeight / DESIGN_HEIGHT;

  const [activeIndex, setActiveIndex] = useState(0);
  const [blurTargetReady, setBlurTargetReady] = useState(false);
  const scrolling = useRef(false);
  const blurTargetRef = useRef<View | null>(null);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.splashBackground);
  }, []);

  const logoWidth = LOGO_WIDTH * scale;
  const logoHeight = LOGO_HEIGHT * scale;
  const logoOffsetTop = insets.top + (LOGO_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const heroRegionTop = insets.top + (HERO_TOP - STATUS_BAR_HEIGHT) * heightScale;
  const panelMinTop = Math.min(
    windowHeight - 300,
    insets.top + (PANEL_TOP - STATUS_BAR_HEIGHT) * heightScale,
  );
  const heroListHeight = Math.max(120, windowHeight - heroRegionTop);
  const sharpClipHeight = Math.max(80, panelMinTop - heroRegionTop);

  const activeSlide = ONBOARDING_SLIDES[activeIndex] ?? ONBOARDING_SLIDES[0]!;

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setActiveIndex(Math.max(0, Math.min(next, ONBOARDING_SLIDES.length - 1)));
      scrolling.current = false;
    },
    [pageWidth],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null && !scrolling.current) {
        setActiveIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <OnboardingSlideView
        height={heroListHeight}
        heroScale={HERO_SCALE}
        sharpClipHeight={sharpClipHeight}
        slide={item}
        width={pageWidth}
      />
    ),
    [heroListHeight, pageWidth, sharpClipHeight],
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

  return (
    <View
      style={[styles.root, { maxWidth: pageWidth, alignSelf: 'center', width: '100%' }]}
      testID="onboarding-shell"
    >
      <Image
        accessibilityLabel="TNGBLE"
        resizeMode="contain"
        source={LOGO}
        style={[
          styles.logo,
          {
            width: logoWidth,
            height: logoHeight,
            top: logoOffsetTop,
            marginLeft: -logoWidth / 2,
          },
        ]}
        testID="onboarding-logo"
      />

      <BlurTargetView
        collapsable={false}
        onLayout={() => {
          if (!blurTargetReady && blurTargetRef.current) {
            setBlurTargetReady(true);
          }
        }}
        ref={blurTargetRef}
        style={[styles.carouselRegion, { top: heroRegionTop, height: heroListHeight }]}
      >
        <FlatList
          data={ONBOARDING_SLIDES}
          decelerationRate="fast"
          disableIntervalMomentum
          extraData={activeIndex}
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          horizontal
          initialNumToRender={2}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={3}
          onMomentumScrollBegin={() => {
            scrolling.current = true;
          }}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollBeginDrag={() => {
            scrolling.current = true;
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          style={styles.list}
          testID="onboarding-carousel"
          viewabilityConfig={viewabilityConfig}
          windowSize={5}
        />
      </BlurTargetView>

      <View style={[styles.panelAnchor, { minHeight: windowHeight - panelMinTop }]}>
        <OnboardingFixedFooter
          blurTarget={blurTargetReady ? blurTargetRef : undefined}
          onCreateAccount={onCreateAccount}
          onLogin={onLogin}
          slide={activeSlide}
          slideCount={ONBOARDING_SLIDE_COUNT}
          slideIndex={activeIndex}
          style={{ paddingBottom: Math.max(insets.bottom, 16), flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    left: '50%',
    zIndex: 4,
  },
  carouselRegion: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  panelAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
});
