import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/design';

export type TestQuestion = {
  id: string;
  passageTitle?: string;
  passageText?: string;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  points: number;
};

interface Props {
  question: TestQuestion;
  selected?: string;
  onSelect: (opt: string) => void;
}

export default function QuestionCard({ question, selected, onSelect }: Props) {
  const optionsList = [
    { key: 'A', value: question.options.A },
    { key: 'B', value: question.options.B },
    { key: 'C', value: question.options.C },
    { key: 'D', value: question.options.D },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Câu hỏi</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{question.points} điểm</Text>
        </View>
      </View>

      {question.passageText && (
        <View style={styles.passageContainer}>
          {question.passageTitle && (
            <Text style={styles.passageTitle}>{question.passageTitle}</Text>
          )}
          <Text style={styles.passageText}>{question.passageText}</Text>
        </View>
      )}

      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.optionsContainer}>
        {optionsList.map(opt => {
          const isSelected = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionRow,
                isSelected && styles.optionRowSelected
              ]}
              onPress={() => onSelect(opt.key)}
            >
              <View style={[
                styles.optionCircle,
                isSelected && styles.optionCircleSelected
              ]}>
                <Text style={[
                  styles.optionKey,
                  isSelected && styles.optionKeySelected
                ]}>{opt.key}</Text>
              </View>
              <Text style={[
                styles.optionValue,
                isSelected && styles.optionValueSelected
              ]}>{opt.value}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  passageContainer: {
    backgroundColor: '#F9FAFB', // surfaceContainerLow
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  passageText: {
    fontSize: 14,
    color: Colors.onSurface,
    lineHeight: 22,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  optionRowSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.primary,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    backgroundColor: Colors.primary,
  },
  optionKey: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  optionKeySelected: {
    color: '#FFFFFF',
  },
  optionValue: {
    flex: 1,
    fontSize: 15,
    color: Colors.onSurface,
  },
  optionValueSelected: {
    color: Colors.onSecondaryFixed,
    fontWeight: '500',
  }
});
