import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { NotebookEntry } from '../../services/notebookService';

interface NotebookWordCardProps {
  entry: NotebookEntry;
  onEdit: (entry: NotebookEntry) => void;
  onDelete: (id: number) => void;
}

export const NotebookWordCard: React.FC<NotebookWordCardProps> = ({
  entry,
  onEdit,
  onDelete,
}) => {
  const word = entry.word;
  const sourceLabel = (() => {
    switch (entry.source_type) {
      case 'reading':
        return 'Đọc hiểu';
      case 'listening':
        return 'Nghe';
      case 'vocabulary':
        return 'Từ vựng';
      default:
        return 'Tự thêm';
    }
  })();

  const dateStr = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString('vi-VN')
    : '';

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.wordInfo}>
          <Text style={styles.headword}>{word?.word || 'Từ vựng'}</Text>
          {word?.phonetic && <Text style={styles.phonetic}>{word.phonetic}</Text>}
          {word?.difficulty && (
            <View style={styles.diffBadge}>
              <Text style={styles.diffText}>{word.difficulty.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Vietnamese Meaning */}
      <Text style={styles.meaning}>{word?.meaning || 'Đang cập nhật nghĩa'}</Text>

      {/* Note Block */}
      {entry.note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            <Text style={styles.noteLabel}>GHI CHÚ: </Text>
            {entry.note}
          </Text>
        </View>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <View style={styles.tagContainer}>
          {entry.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Info & Actions */}
      <View style={styles.footerRow}>
        <Text style={styles.sourceText}>
          Nguồn: {sourceLabel} {dateStr ? `· ${dateStr}` : ''}
        </Text>

        <View style={styles.actionGroup}>
          <TouchableOpacity onPress={() => onEdit(entry)} style={styles.actionBtn}>
            <Text style={styles.editText}>Sửa</Text>
          </TouchableOpacity>
          <Text style={styles.actionDivider}>·</Text>
          <TouchableOpacity onPress={() => onDelete(entry.id)} style={styles.actionBtn}>
            <Text style={styles.deleteText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  headword: {
    ...Typography.headlineMd,
    color: Colors.onSecondaryFixed,
    fontWeight: '700',
  },
  phonetic: {
    ...Typography.bodyMd,
    color: 'rgba(4, 32, 20, 0.7)',
    fontFamily: 'monospace',
  },
  diffBadge: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.sm,
  },
  diffText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  srsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
  },
  srsText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  meaning: {
    ...Typography.titleSm,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: Rounded.md,
    padding: Spacing.sm,
  },
  noteText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    lineHeight: 20,
  },
  noteLabel: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.full,
  },
  tagText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryFixed,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(4, 32, 20, 0.1)',
  },
  sourceText: {
    ...Typography.labelSm,
    color: 'rgba(4, 32, 20, 0.65)',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionDivider: {
    color: 'rgba(4, 32, 20, 0.3)',
    ...Typography.bodyMd,
  },
  editText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  deleteText: {
    ...Typography.labelMd,
    color: Colors.tertiary,
    fontWeight: '700',
  },
});
