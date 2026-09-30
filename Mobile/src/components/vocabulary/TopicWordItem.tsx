import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { VocabularyWord } from '../../services/vocabularyService';

interface TopicWordItemProps {
  word: VocabularyWord;
  isSaved?: boolean;
  onToggleSave: (word: VocabularyWord) => void;
}

export const TopicWordItem: React.FC<TopicWordItemProps> = ({
  word,
  isSaved = false,
  onToggleSave,
}) => {
  const getDifficultyLabel = () => {
    switch (word.difficulty?.toLowerCase()) {
      case 'a1':
      case 'a2':
        return 'Dễ';
      case 'b1':
      case 'b2':
        return 'Vừa';
      case 'c1':
      case 'c2':
        return 'Khó';
      default:
        return 'Vừa';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.wordInfo}>
          <Text style={styles.headword}>{word.word}</Text>
          {word.phonetic && <Text style={styles.phonetic}>{word.phonetic}</Text>}
        </View>

        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>{getDifficultyLabel()}</Text>
        </View>
      </View>

      <Text style={styles.meaning}>{word.meaning}</Text>

      {word.example_sentence && (
        <Text style={styles.example} numberOfLines={2}>
          {word.example_sentence}
        </Text>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.metaText}>
          {word.difficulty ? `${word.difficulty.toUpperCase()} · ` : ''}Từ vựng
        </Text>

        <TouchableOpacity
          onPress={() => onToggleSave(word)}
          style={styles.saveBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveBtnText, isSaved && styles.saveBtnSaved]}>
            {isSaved ? 'Đã lưu sổ tay' : 'Lưu sổ tay'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  headword: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  phonetic: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontFamily: 'monospace',
  },
  diffBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  diffText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  meaning: {
    ...Typography.titleSm,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  example: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metaText: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  saveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  saveBtnText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  saveBtnSaved: {
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
