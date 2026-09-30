import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/design';

export type TestResultType = {
  attemptId: string;
  bandScore: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  timeSpent: number;
  passageResults: Array<{
    title: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
  aiComment: string;
};

interface Props {
  result: TestResultType;
  onRetry: () => void;
  onViewDetail: () => void;
  onBack: () => void;
}

export default function TestResult({ result, onRetry, onViewDetail, onBack }: Props) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.bandLabel}>Band Score</Text>
          <Text style={styles.bandScore}>{result.bandScore.toFixed(1)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result.correctCount}/{result.totalCount}</Text>
            <Text style={styles.statLabel}>Số câu đúng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result.accuracy}%</Text>
            <Text style={styles.statLabel}>Độ chính xác</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(result.timeSpent)}</Text>
            <Text style={styles.statLabel}>Thời gian làm</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân tích theo bài đọc</Text>
          {result.passageResults.map((p, idx) => (
            <View key={idx} style={styles.passageCard}>
              <View style={styles.passageHeader}>
                <Text style={styles.passageTitle} numberOfLines={1}>{p.title}</Text>
                <View style={styles.percentageBadge}>
                  <Text style={styles.percentageText}>{p.percentage}%</Text>
                </View>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${p.percentage}%` }]} />
              </View>
              <Text style={styles.passageSub}>Đúng {p.correct}/{p.total} câu</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhận xét từ AI</Text>
          <View style={styles.aiCard}>
            <Text style={styles.aiText}>{result.aiComment}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={onViewDetail}>
            <Text style={styles.btnSecondaryText}>Xem chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onRetry}>
            <Text style={styles.btnSecondaryText}>Làm lại</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={onBack}>
          <Text style={styles.btnPrimaryText}>Quay về danh sách</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  bandLabel: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  bandScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 16,
  },
  passageCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  passageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passageTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurface,
    marginRight: 12,
  },
  percentageBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    color: Colors.onSecondaryFixed,
    fontSize: 12,
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  passageSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  aiCard: {
    backgroundColor: Colors.primaryContainer,
    padding: 16,
    borderRadius: 16,
  },
  aiText: {
    fontSize: 14,
    color: Colors.onSurface,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
