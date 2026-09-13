import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

type OnboardingPaginationProps = {
  count: number;
  activeIndex: number;
};

export function OnboardingPagination({ count, activeIndex }: OnboardingPaginationProps) {
  return (
    <View
      accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}
      accessibilityRole="adjustable"
      style={styles.row}
      testID="onboarding-pagination"
    >
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[styles.dot, active ? styles.active : styles.inactive]}
            testID={active ? 'onboarding-pagination-active' : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 6,
  },
  dot: {
    borderRadius: 999,
  },
  active: {
    width: 28,
    height: 6,
    backgroundColor: colors.paginationActive,
  },
  inactive: {
    width: 6,
    height: 6,
    backgroundColor: colors.paginationInactive,
  },
});
