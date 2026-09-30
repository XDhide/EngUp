import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  masteryLevel?: number;
}

interface WordListItemProps {
  word: Word;
  onSave?: () => void;
}

export const WordListItem: React.FC<WordListItemProps> = ({ word, onSave }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable style={styles.container} onPress={() => setExpanded(!expanded)}>
      <View style={styles.row}>
        <View style={styles.wordInfo}>
          <Text style={styles.word}>{word.word}</Text>
          <Text style={styles.phonetic}>{word.phonetic}</Text>
        </View>
        <View style={styles.masteryContainer}>
          {word.masteryLevel !== undefined && (
            <View style={[styles.masteryChip, word.masteryLevel === 0 && styles.masteryChipDone]}>
              <Text style={[styles.masteryText, word.masteryLevel === 0 && styles.masteryTextDone]}>
                {word.masteryLevel === 0 ? 'Đã thuộc' : `Level ${word.masteryLevel}`}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.meaning}>{word.meaning}</Text>
          <Text style={styles.example}>{word.example}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordInfo: {
    flex: 1,
  },
  word: {
    fontSize: 14, // title-sm
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  phonetic: {
    fontSize: 12,
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  masteryContainer: {
    marginLeft: Spacing.md,
  },
  masteryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryContainer,
  },
  masteryChipDone: {
    backgroundColor: Colors.surface,
  },
  masteryText: {
    fontSize: 10,
    color: Colors.onSecondaryFixed,
  },
  masteryTextDone: {
    color: Colors.onSurface,
  },
  expandedContent: {
    marginTop: Spacing.md,
  },
  meaning: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  example: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
