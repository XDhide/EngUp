import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

type Question = { id: string; text: string; options: { A: string; B: string; C: string; D: string }; correct?: string; explanation?: string };

interface QuizOptionsProps {
  question: Question;
  selected?: string;
  onSelect: (option: string) => void;
  showResult?: boolean;
}

export const QuizOptions: React.FC<QuizOptionsProps> = ({ question, selected, onSelect, showResult }) => {
  const options = Object.entries(question.options || {}) as [string, string][];

  return (
    <View style={styles.container}>
      {options.map(([key, text]) => {
        const isSelected = selected === key;
        const isCorrect = showResult && question.correct === key;
        const isWrong = showResult && isSelected && question.correct !== key;

        let containerStyle: any[] = [styles.optionContainer];
        let badgeStyle: any[] = [styles.badge];
        let textStyle: any[] = [styles.text];

        if (isCorrect) {
          containerStyle.push(styles.correctContainer);
          badgeStyle.push(styles.correctBadge);
          textStyle.push(styles.correctText);
        } else if (isWrong) {
          containerStyle.push(styles.wrongContainer);
          badgeStyle.push(styles.wrongBadge);
          textStyle.push(styles.wrongText);
        } else if (isSelected && !showResult) {
          containerStyle.push(styles.selectedContainer);
          badgeStyle.push(styles.selectedBadge);
        }

        return (
          <TouchableOpacity
            key={key}
            style={containerStyle}
            onPress={() => !showResult && onSelect(key)}
            disabled={showResult}
          >
            <View style={badgeStyle}>
              <Text style={isSelected || isCorrect || isWrong ? styles.badgeTextSelected : styles.badgeText}>
                {key}
              </Text>
            </View>
            <Text style={textStyle}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedContainer: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.border,
  },
  correctContainer: {
    backgroundColor: '#d1fae5',
    borderColor: Colors.primary,
  },
  wrongContainer: {
    backgroundColor: Colors.errorContainer,
    borderColor: Colors.error,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  selectedBadge: {
    backgroundColor: Colors.primaryContainer,
  },
  correctBadge: {
    backgroundColor: Colors.primary,
  },
  wrongBadge: {
    backgroundColor: Colors.error,
  },
  badgeText: {
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  badgeTextSelected: {
    fontWeight: 'bold',
    color: '#fff',
  },
  text: {
    flex: 1,
    color: Colors.onSurface,
    fontSize: 16,
  },
  correctText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  wrongText: {
    fontWeight: '600',
    color: Colors.error,
  },
});
