import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface PlacementResultViewProps {
  suggestedLevel: string;
  onStartLearning: () => void;
  onRetest: () => void;
}

export const PlacementResultView: React.FC<PlacementResultViewProps> = ({
  suggestedLevel = 'B1',
  onStartLearning,
  onRetest,
}) => {
  const getLevelDescription = () => {
    switch (suggestedLevel.toUpperCase()) {
      case 'A1':
        return 'Người mới bắt đầu (Beginner): Nắm vững từ vựng cơ bản và mẫu câu giao tiếp đơn giản thường ngày.';
      case 'A2':
        return 'Sơ cấp (Elementary): Có thể đọc hiểu các đoạn văn ngắn và giao tiếp trong các tình huống quen thuộc.';
      case 'B1':
        return 'Trung cấp (Intermediate): Có thể diễn đạt ý kiến, đọc hiểu bài báo cơ bản và nghe hiểu nội dung phổ biến.';
      case 'B2':
        return 'Trung cao cấp (Upper-Intermediate): Tự tin giao tiếp lưu loát, đọc hiểu các tài liệu học thuật và chuyên môn.';
      case 'C1':
      case 'C2':
        return 'Cao cấp (Advanced / Mastery): Thành thạo tiếng Anh như người bản xứ, đọc hiểu văn bản phức tạp dễ dàng.';
      default:
        return 'Trình độ được cá nhân hóa theo lộ trình thuật toán lặp lại ngắt quãng SRS.';
    }
  };

  return (
    <View style={styles.container}>
      {/* Assessment Card */}
      <View style={styles.card}>
        <Text style={styles.headerTag}>KẾT QUẢ ĐÁNH GIÁ TRÌNH ĐỘ</Text>

        <View style={styles.levelCircle}>
          <Text style={styles.levelNumber}>{suggestedLevel.toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>
          Trình độ đề xuất của bạn: {suggestedLevel.toUpperCase()}
        </Text>

        <Text style={styles.desc}>{getLevelDescription()}</Text>

        <View style={styles.srsFeatureBox}>
          <Text style={styles.featureTitle}>LỘ TRÌNH ENGUP ĐÃ SẴN SÀNG</Text>
          <Text style={styles.featureText}>
            • 10 từ mới mỗi ngày phù hợp trình độ {suggestedLevel.toUpperCase()}{'\n'}
            • Lặp lại ngắt quãng SRS theo đường cong quên lãng Ebbinghaus{'\n'}
            • Dự đoán thời gian ôn tập tối ưu
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={onStartLearning}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Bắt đầu học ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRetest} style={styles.retestBtn} activeOpacity={0.7}>
          <Text style={styles.retestBtnText}>Làm lại bài kiểm tra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  headerTag: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  levelCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  levelNumber: {
    ...Typography.headlineLg,
    fontSize: 40,
    lineHeight: 48,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  desc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  srsFeatureBox: {
    width: '100%',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    gap: 6,
    marginTop: Spacing.xs,
  },
  featureTitle: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featureText: {
    ...Typography.bodyMd,
    color: Colors.onSecondaryContainer,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionGroup: {
    gap: Spacing.sm,
  },
  startBtn: {
    height: 52,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  retestBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  retestBtnText: {
    ...Typography.labelMd,
    color: Colors.outline,
    fontWeight: '600',
  },
});
