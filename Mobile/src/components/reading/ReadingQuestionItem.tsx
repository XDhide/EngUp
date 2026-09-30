import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ReadingQuestion, parseOptions } from '../../services/readingService';

interface ReadingQuestionItemProps {
  question: ReadingQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (optionKey: string) => void;
}

export const ReadingQuestionItem: React.FC<ReadingQuestionItemProps> = ({
  question,
  questionIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
}) => {
  // Backend trả "A. nội dung"; tách để chữ cái không bị hiển thị hai lần.
  const parsedOptions = parseOptions(question.options);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.stepTitle}>
          CÂU HỎI {questionIndex + 1}/{totalQuestions}
        </Text>
        <Text style={styles.hintTitle}>Chọn 1 đáp án đúng nhất</Text>
      </View>

      {/* Prompt Card */}
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{question.question_text}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionList}>
        {parsedOptions.map((item) => {
          const isSelected = selectedOption === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.optionBtn,
                isSelected ? styles.optionBtnSelected : styles.optionBtnUnselected,
              ]}
              onPress={() => onSelectOption(item.key)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionKey,
                    isSelected ? styles.optionKeySelected : styles.optionKeyUnselected,
                  ]}
                >
                  {item.key}
                </Text>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected ? styles.optionLabelSelected : styles.optionLabelUnselected,
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              {isSelected && (
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>Đã chọn</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hintTitle: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  promptCard: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
  },
  promptText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
    lineHeight: 24,
  },
  optionList: {
    gap: Spacing.sm,
  },
  optionBtn: {
    minHeight: 56,
    borderRadius: Rounded.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  optionBtnUnselected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  optionBtnSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.primaryContainer,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  optionKey: {
    ...Typography.labelMd,
    fontWeight: '700',
    width: 20,
  },
  optionKeyUnselected: {
    color: Colors.secondary,
  },
  optionKeySelected: {
    color: Colors.primary,
  },
  optionLabel: {
    ...Typography.bodyMd,
    flex: 1,
  },
  optionLabelUnselected: {
    color: Colors.onSurface,
  },
  optionLabelSelected: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  selectedTag: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
  },
  selectedTagText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
