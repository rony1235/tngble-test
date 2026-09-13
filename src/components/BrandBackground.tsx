import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors } from '@/theme/tokens';

const BG = require('../../assets/brand/bg.jpg');

type BrandBackgroundProps = {
  crop?: 'fill' | 'top';
  testID?: string;
};

export function BrandBackground({
  crop = 'fill',
  testID = 'brand-background',
}: BrandBackgroundProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={styles.root} testID={testID}>
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="cover"
        source={BG}
        style={
          crop === 'top'
            ? [styles.imageTop, { width: windowWidth, height: windowHeight }]
            : [styles.image, { width: windowWidth, height: windowHeight }]
        }
        testID={`${testID}-image`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.splashBackground,
    overflow: 'hidden',
    zIndex: 0,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageTop: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
