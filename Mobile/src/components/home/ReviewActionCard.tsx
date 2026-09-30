import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface ReviewActionCardProps {
  reviewCount: number;
  onPress: () => void;
}

export const ReviewActionCard: React.FC<ReviewActionCardProps> = ({
  reviewCount = 0,
  onPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.contentGroup}>
        <Text style={styles.label}>LẶP LẠI NGẮT QUÃNG</Text>
        <Text style={styles.headline}>Hôm nay cần ôn: {reviewCount} từ</Text>
        <Text style={styles.subtext}>
          Ôn tập đúng thời điểm giúp ghi nhớ lâu hơn x3
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Ôn tập ngay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.md + 4,
    gap: Spacing.md,
  },
  contentGroup: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.labelSm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  headline: {
    ...Typography.headlineLg,
    color: Colors.onPrimary,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtext: {
    ...Typography.bodyMd,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  actionBtn: {
    height: 48,
    borderRadius: Rounded.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
});
