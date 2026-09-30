import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface DailyTargetStepperProps {
  initialLimit: number;
  onSave: (limit: number) => Promise<void> | void;
}

export const DailyTargetStepper: React.FC<DailyTargetStepperProps> = ({
  initialLimit = 10,
  onSave,
}) => {
  const [limit, setLimit] = useState(initialLimit);
  const [saving, setSaving] = useState(false);

  const handleDecrease = () => {
    if (limit > 5) setLimit((prev) => prev - 5);
  };

  const handleIncrease = () => {
    if (limit < 50) setLimit((prev) => prev + 5);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(limit);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Giới hạn từ mới mỗi ngày</Text>
        <Text style={styles.desc}>
          Điều chỉnh số lượng từ mới hệ thống gợi ý học mỗi ngày phù hợp với quỹ thời gian của bạn.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={handleDecrease}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.limitValue}>{limit}</Text>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={handleIncrease}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.4)',
  },
  headerGroup: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  desc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 4,
    borderRadius: Rounded.md,
    gap: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: Rounded.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    lineHeight: 24,
  },
  limitValue: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    minWidth: 44,
    textAlign: 'center',
  },
  saveBtn: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
