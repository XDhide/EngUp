import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { AiFeedback } from '../../services/writingService';

interface WritingFeedbackViewProps {
  score: number | null;
  feedback: AiFeedback | null;
}

const toLines = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))) : [];

export const WritingFeedbackView: React.FC<WritingFeedbackViewProps> = ({ score, feedback }) => {
  const grammar = toLines(feedback?.grammar_errors);
  const vocab = toLines(feedback?.vocabulary_suggestions);

  return (
    <View style={styles.wrap}>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>ĐIỂM AI</Text>
        <Text style={styles.scoreValue}>{score !== null ? `${score}/100` : '—'}</Text>
      </View>

      {!!feedback?.overall_comment && (
        <View style={styles.card}>
          <Text style={styles.label}>NHẬN XÉT TỔNG QUAN</Text>
          <Text style={styles.body}>{feedback.overall_comment}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>LỖI NGỮ PHÁP ({grammar.length})</Text>
        {grammar.length === 0 ? (
          <Text style={styles.body}>Không phát hiện lỗi ngữ pháp đáng kể.</Text>
        ) : (
          grammar.map((g, i) => (
            <View key={i} style={[styles.item, styles.itemError]}>
              <Text style={styles.itemText}>{g}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>GỢI Ý TỪ VỰNG ({vocab.length})</Text>
        {vocab.length === 0 ? (
          <Text style={styles.body}>Chưa có gợi ý bổ sung.</Text>
        ) : (
          vocab.map((v, i) => (
            <View key={i} style={[styles.item, styles.itemHint]}>
              <Text style={styles.itemText}>{v}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  scoreCard: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: { ...Typography.labelSm, color: Colors.onSecondaryContainer, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { color: Colors.primary, fontWeight: '800', fontSize: 40, lineHeight: 48 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  label: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  body: { ...Typography.bodyMd, color: Colors.onSurface },
  item: { borderRadius: Rounded.md, padding: Spacing.sm + 2 },
  itemError: { backgroundColor: Colors.errorContainer },
  itemHint: { backgroundColor: Colors.surfaceContainerLow },
  itemText: { ...Typography.bodyMd, color: Colors.onSurface },
});
