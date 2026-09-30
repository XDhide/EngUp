import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

type VocabItem = { word: string; phonetic: string; pos: string; meaning: string; example: string };

interface VocabSheetProps {
  vocab: VocabItem | null;
  onClose: () => void;
  onSave: (word: string) => void;
}

export const VocabSheet: React.FC<VocabSheetProps> = ({ vocab, onClose, onSave }) => {
  if (!vocab) return null;

  return (
    <Modal visible={!!vocab} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.sheetContainer}>
            <View style={styles.dragHandle} />
            
            <View style={styles.header}>
              <View>
                <Text style={styles.word}>{vocab.word}</Text>
                <Text style={styles.phonetic}>{vocab.phonetic}</Text>
              </View>
              <View style={styles.posChip}>
                <Text style={styles.posText}>{vocab.pos}</Text>
              </View>
            </View>

            <Text style={styles.meaning}>{vocab.meaning}</Text>
            
            {vocab.example && (
              <View style={styles.exampleContainer}>
                <Text style={styles.example}>"{vocab.example}"</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(vocab.word)}>
                <Text style={styles.saveBtnText}>Lưu vào sổ tay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.onSurfaceVariant,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  word: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  phonetic: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  posChip: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  posText: {
    fontSize: 12,
    color: Colors.onSecondaryFixed,
    fontWeight: '500',
  },
  meaning: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  exampleContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  example: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.onSurface,
  },
  actions: {
    gap: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  closeBtn: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
    fontSize: 16,
  },
});
