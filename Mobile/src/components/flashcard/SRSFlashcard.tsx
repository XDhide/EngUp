import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { VocabularyWord } from '../../services/vocabularyService';

interface SRSFlashcardProps {
  word: VocabularyWord;
  isFlipped: boolean;
  onFlip: () => void;
  srsStage?: number;
}

export const SRSFlashcard: React.FC<SRSFlashcardProps> = ({
  word,
  isFlipped,
  onFlip,
  srsStage = 1,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onFlip}
      activeOpacity={0.95}
    >
      {!isFlipped ? (
        // FRONT SIDE
        <View style={styles.frontContainer}>
          <View style={styles.topMeta}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>
                {word.difficulty ? `${word.difficulty.toUpperCase()} · ` : ''}TỪ VỰNG
              </Text>
            </View>
            <Text style={styles.srsLabel}>SRS CẤP {srsStage}</Text>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.headword}>{word.word}</Text>
            {word.phonetic && (
              <Text style={styles.phonetic}>{word.phonetic}</Text>
            )}
          </View>

          <View style={styles.flipPrompt}>
            <View style={styles.flipBtn}>
              <Text style={styles.flipBtnText}>Xem nghĩa & ví dụ</Text>
            </View>
          </View>
        </View>
      ) : (
        // BACK SIDE
        <View style={styles.backContainer}>
          <View style={styles.topMeta}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>
                {word.difficulty ? `${word.difficulty.toUpperCase()} · ` : ''}CHI TIẾT
              </Text>
            </View>
            <Text style={styles.closeHint}>Chạm để lật lại</Text>
          </View>

          <View style={styles.wordHeader}>
            <Text style={styles.backHeadword}>{word.word}</Text>
            {word.phonetic && (
              <Text style={styles.phoneticSmall}>{word.phonetic}</Text>
            )}
          </View>

          {/* Vietnamese Meaning Block */}
          <View style={styles.meaningBox}>
            <Text style={styles.meaningLabel}>Ý NGHĨA CHÍNH</Text>
            <Text style={styles.meaningText}>{word.meaning}</Text>
          </View>

          {/* Example Sentence Block */}
          {word.example_sentence && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>VÍ DỤ THỰC TẾ</Text>
              <Text style={styles.exampleText}>&quot;{word.example_sentence}&quot;</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 380,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  frontContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Rounded.full,
  },
  tagText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  srsLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '600',
  },
  closeHint: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  headword: {
    ...Typography.headlineLg,
    fontSize: 32,
    lineHeight: 40,
    color: Colors.onSurface,
    fontWeight: '800',
    textAlign: 'center',
  },
  phonetic: {
    ...Typography.bodyLg,
    color: Colors.outline,
    marginTop: Spacing.xs,
    fontFamily: 'monospace',
  },
  wordHeader: {
    marginTop: Spacing.xs,
  },
  backHeadword: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  phoneticSmall: {
    ...Typography.bodyMd,
    color: Colors.outline,
  },
  meaningBox: {
    backgroundColor: 'rgba(202, 234, 214, 0.4)',
    borderRadius: Rounded.md,
    padding: Spacing.md,
    gap: 4,
  },
  meaningLabel: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  meaningText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    lineHeight: 22,
  },
  exampleBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    gap: 4,
  },
  exampleLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '700',
  },
  exampleText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  flipPrompt: {
    width: '100%',
    paddingTop: Spacing.sm,
  },
  flipBtn: {
    height: 44,
    borderRadius: Rounded.md,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtnText: {
    ...Typography.labelMd,
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },
});
