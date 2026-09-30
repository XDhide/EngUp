import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { DictationResult as ResultType } from '@/services/listening.service';

interface Props {
  result: ResultType;
  onRetry: () => void;
  onNext: () => void;
  onRate: (rating: string) => void;
}

export const DictationResult: React.FC<Props> = ({ result, onRetry, onNext, onRate }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.accuracyText}>{result.accuracy}% Chính xác</Text>
        <Text style={styles.srsText}>{result.srsRating} ({result.nextDueDate})</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bài làm của bạn:</Text>
        <View style={styles.resultTextContainer}>
          <Text style={styles.userText}>{result.userText}</Text>
        </View>

        <Text style={styles.sectionTitle}>Đáp án đúng:</Text>
        <Text style={styles.correctText}>{result.correctText}</Text>
      </View>
      
      {result.errors.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lỗi cần chú ý:</Text>
          {result.errors.map((error, idx) => (
            <View key={idx} style={styles.errorItem}>
              <Text style={styles.errorWord}>Sai: {error.word}</Text>
              <Text style={styles.correctionWord}>Sửa: {error.correction}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.srsContainer}>
        <Text style={styles.srsLabel}>Mức độ ghi nhớ của bạn?</Text>
        <View style={styles.srsButtons}>
          {['Chưa nhớ', 'Khó', 'Tốt', 'Dễ'].map(rate => (
            <Pressable key={rate} style={styles.srsBtn} onPress={() => onRate(rate)}>
              <Text style={styles.srsBtnText}>{rate}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Luyện lại</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>Bài tiếp theo</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  srsText: {
    fontSize: 14,
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  resultTextContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: '#FEE2E2', // error-container bg
    borderRadius: Radius.md,
  },
  userText: {
    fontSize: 16,
    color: '#111827',
  },
  correctText: {
    fontSize: 16,
    color: Colors.primary,
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  errorItem: {
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  errorWord: {
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  correctionWord: {
    color: Colors.primary,
    fontWeight: '600',
  },
  srsContainer: {
    marginBottom: Spacing.xl,
  },
  srsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  srsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  srsBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  srsBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  retryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  retryText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
