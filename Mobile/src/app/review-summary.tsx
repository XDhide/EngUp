import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';

export default function ReviewSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Chỉ dùng giá trị thật từ phiên ôn; thiếu tham số thì là 0 (không bịa số liệu).
  const num = (v: string | string[] | undefined) => Number(Array.isArray(v) ? v[0] : v) || 0;
  const easy = num(params.easy);
  const good = num(params.good);
  const hard = num(params.hard);
  const again = num(params.again);
  const total = num(params.total) || easy + good + hard + again;
  const seconds = num(params.seconds);

  const recalledCount = easy + good;
  const recallRate = total > 0 ? Math.round((recalledCount / total) * 100) : 0;
  const durationText =
    seconds >= 60 ? `${Math.floor(seconds / 60)} phút ${seconds % 60} giây` : `${seconds} giây`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Tổng Kết Ôn Tập"
        showBack
        backLabel="Trang chủ"
        onBack={() => router.replace('/(tabs)')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Success Card */}
        <View style={styles.summaryCard}>
          <View style={styles.rateCircle}>
            <Text style={styles.rateNumber}>{recallRate}%</Text>
            <Text style={styles.rateLabel}>GHI NHỚ</Text>
          </View>

          <Text style={styles.headline}>Hoàn thành phiên ôn tập!</Text>
          <Text style={styles.subtext}>
            Bạn đã hoàn thành phiên ôn tập {total} từ vựng ngắt quãng hôm nay
            {seconds > 0 ? ` trong ${durationText}` : ''}.
          </Text>

          {/* Breakdown Grid */}
          <View style={styles.breakdownGrid}>
            <View style={[styles.statBox, styles.statEasy]}>
              <Text style={styles.statCount}>{easy}</Text>
              <Text style={styles.statLabel}>Dễ</Text>
            </View>

            <View style={[styles.statBox, styles.statGood]}>
              <Text style={styles.statCount}>{good}</Text>
              <Text style={styles.statLabel}>Tốt</Text>
            </View>

            <View style={[styles.statBox, styles.statHard]}>
              <Text style={styles.statCount}>{hard}</Text>
              <Text style={styles.statLabel}>Khó</Text>
            </View>

            <View style={[styles.statBox, styles.statAgain]}>
              <Text style={styles.statCount}>{again}</Text>
              <Text style={styles.statLabel}>Chưa nhớ</Text>
            </View>
          </View>

          <View style={styles.srsExplanation}>
            <Text style={styles.srsExplanationTitle}>THUẬT TOÁN SRS GHI NHẬN</Text>
            <Text style={styles.srsExplanationText}>
              Khoảng cách lặp lại của từng thẻ đã được hệ thống cập nhật dựa trên mức ghi nhớ bạn vừa đánh giá.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Về trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/daily-words')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Học thêm từ mới</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  rateCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateNumber: {
    ...Typography.headlineLg,
    fontSize: 34,
    lineHeight: 40,
    color: Colors.primary,
    fontWeight: '800',
  },
  rateLabel: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  headline: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subtext: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginTop: Spacing.xs,
  },
  statBox: {
    width: '48%',
    borderRadius: Rounded.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statEasy: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statGood: {
    backgroundColor: 'rgba(202, 234, 214, 0.6)',
  },
  statHard: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  statAgain: {
    backgroundColor: Colors.errorContainer,
  },
  statCount: {
    ...Typography.headlineMd,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  srsExplanation: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    width: '100%',
    gap: 4,
  },
  srsExplanationTitle: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  srsExplanationText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    fontSize: 13,
  },
  actionGroup: {
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 50,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: Rounded.md,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...Typography.labelMd,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
