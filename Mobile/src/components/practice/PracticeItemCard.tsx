import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface PracticeItemCardProps {
  title: string;
  /** Nhãn nhỏ phía trên (chủ đề, loại đề...). Nhãn đầu tiên nổi bật hơn. */
  badges?: string[];
  description?: string;
  meta?: string;
  ctaLabel: string;
  onPress: () => void;
}

export const PracticeItemCard: React.FC<PracticeItemCardProps> = ({
  title,
  badges = [],
  description,
  meta,
  ctaLabel,
  onPress,
}) => (
  <View style={styles.card}>
    {badges.length > 0 && (
      <View style={styles.badgeRow}>
        {badges.map((b, i) => (
          <View key={`${b}-${i}`} style={[styles.badge, i === 0 ? styles.badgePrimary : styles.badgeSecondary]}>
            <Text style={[styles.badgeText, i === 0 ? styles.badgeTextPrimary : styles.badgeTextSecondary]}>
              {b}
            </Text>
          </View>
        ))}
      </View>
    )}
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    {!!description && (
      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>
    )}
    <View style={styles.footer}>
      <Text style={styles.meta}>{meta ?? ''}</Text>
      <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/** Ô trạng thái rỗng / lỗi dùng chung cho các panel */
export const PanelMessage: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <View style={styles.message}>
    <Text style={styles.messageTitle}>{title}</Text>
    {!!description && <Text style={styles.messageDesc}>{description}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Rounded.sm },
  badgePrimary: { backgroundColor: Colors.secondaryContainer },
  badgeSecondary: { backgroundColor: Colors.surfaceContainerLow },
  badgeText: { ...Typography.labelSm, fontWeight: '700' },
  badgeTextPrimary: { color: Colors.primary },
  badgeTextSecondary: { color: Colors.onSurfaceVariant },
  title: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  description: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  meta: { ...Typography.labelSm, color: Colors.onSurfaceVariant, flex: 1 },
  cta: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Rounded.md,
  },
  ctaText: { ...Typography.labelMd, color: Colors.onPrimaryContainer, fontWeight: '700' },
  message: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  messageTitle: { ...Typography.titleSm, color: Colors.onSurface, textAlign: 'center' },
  messageDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
