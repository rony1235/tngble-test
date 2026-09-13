import { Image, StyleSheet, Text, View } from 'react-native';

import type { AuthSheetMockUser } from '@/auth/auth-sheet.types';
import { colors, typography } from '@/theme/tokens';

const AVATAR = require('../../assets/auth/mock-avatar.png');

type AuthAccountCardProps = {
  user: AuthSheetMockUser;
};

export function AuthAccountCard({ user }: AuthAccountCardProps) {
  return (
    <View style={styles.card} testID="auth-sheet-account">
      <View style={styles.row}>
        <View style={styles.avatarWell}>
          <Image
            accessibilityLabel={user.name}
            resizeMode="cover"
            source={AVATAR}
            style={styles.avatar}
          />
        </View>
        <View style={styles.textCol}>
          <Text numberOfLines={1} style={styles.name}>
            {user.name}
          </Text>
          <Text numberOfLines={1} style={styles.email}>
            {user.email}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 343,
    backgroundColor: colors.authSheetCard,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWell: {
    width: 36,
    height: 36,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.authAvatarBorder,
    backgroundColor: colors.white,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    position: 'absolute',
    left: -1,
    top: -5,
    width: 36,
    height: 59,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.authAccountName,
    color: colors.white,
    marginBottom: -6,
  },
  email: {
    ...typography.authAccountEmail,
    color: colors.licensedText,
  },
});
