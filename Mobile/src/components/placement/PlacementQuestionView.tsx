import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { PlacementQuestion } from '../../services/authService';
import { ProgressBar } from '../common/ProgressBar';

interface PlacementQuestionViewProps {
  question: PlacementQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export const PlacementQuestionView: React.FC<PlacementQuestionViewProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onNext,
  onSkip,
  isSubmitting = false,
}) => {
  const progressRatio = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // key = option.id gửi lên backend; letter chỉ để hiển thị.
  const options: Array<{ key: string; letter: string; label: string }> = (
    Array.isArray(question.options) ? question.options : []
  ).map((opt, idx) => ({
    key: opt.id,
    letter: ['A', 'B', 'C', 'D', 'E', 'F'][idx] || String(idx + 1),
    label: opt.text,
  }));

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.questionCounter}>
            Câu {currentIndex + 1}/{totalQuestions}
          </Text>
          <Text style={styles.percentText}>Tiến độ {progressPercent}%</Text>
        </View>
        <ProgressBar progress={progressRatio} height={6} />
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>NGỮ PHÁP & TỪ VỰNG</Text>
          <Text style={styles.timeEstimate}>Ước tính: 45 giây</Text>
        </View>

        <Text style={styles.promptText}>{question.question_text}</Text>
        <Text style={styles.subPrompt}>
          Chọn dạng thức đúng để hoàn thành câu.
        </Text>
      </View>

      {/* Option List */}
      <View style={styles.optionList}>
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;

          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionBtn,
                isSelected ? styles.optionSelected : styles.optionUnselected,
              ]}
              onPress={() => onSelectOption(opt.key)}
              activeOpacity={0.8}
            >
              <View style={styles.optionLeft}>
                <Text
                  style={[
                    styles.optionKey,
                    isSelected ? styles.optionKeySelected : styles.optionKeyUnselected,
                  ]}
                >
                  {opt.letter}
                </Text>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected ? styles.optionLabelSelected : styles.optionLabelUnselected,
                  ]}
                >
                  {opt.label}
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

      {/* Actions */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedOption && styles.btnDisabled]}
          onPress={onNext}
          disabled={!selectedOption || isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === totalQuestions - 1 ? 'Hoàn thành & Xem kết quả' : 'Tiếp theo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>Bỏ qua câu này</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCounter: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  percentText: {
    ...Typography.labelSm,
    color: Colors.secondary,
  },
  questionCard: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timeEstimate: {
    ...Typography.labelSm,
    color: Colors.secondary,
  },
  promptText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: Spacing.xs,
  },
  subPrompt: {
    ...Typography.bodyMd,
    color: Colors.onSecondaryContainer,
    opacity: 0.85,
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
  optionUnselected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  optionSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.primaryContainer,
  },
  optionLeft: {
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
    fontWeight: '700',
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
  actionGroup: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  nextBtn: {
    height: 50,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipBtnText: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
});
