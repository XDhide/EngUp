import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { NotebookEntry } from '../../services/notebookService';

interface NotebookEditModalProps {
  visible: boolean;
  entry: NotebookEntry | null;
  onClose: () => void;
  onSave: (id: number, data: { note: string; tags: string[] }) => Promise<void>;
}

export const NotebookEditModal: React.FC<NotebookEditModalProps> = ({
  visible,
  entry,
  onClose,
  onSave,
}) => {
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setNote(entry.note || '');
      setTags(entry.tags || []);
    }
  }, [entry]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      await onSave(entry.id, { note, tags });
      onClose();
    } catch {
      // Màn cha đã hiển thị lỗi; giữ modal mở để người dùng thử lại.
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Chỉnh sửa ghi chú sổ tay</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.wordTitle}>{entry.word?.word}</Text>
          <Text style={styles.wordMeaning}>{entry.word?.meaning}</Text>

          {/* Note Input */}
          <Text style={styles.inputLabel}>Ghi chú cá nhân</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Nhập ghi chú cách nhớ, ngữ cảnh..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
          />

          {/* Tags */}
          <Text style={styles.inputLabel}>Thẻ phân loại (Tags)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Thêm tag (VD: ielts, giao tiep)..."
              placeholderTextColor={Colors.outline}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity onPress={handleAddTag} style={styles.addTagBtn}>
              <Text style={styles.addTagText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {/* Tag List */}
          <View style={styles.tagList}>
            {tags.map((t, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleRemoveTag(t)}
                style={styles.tagChip}
              >
                <Text style={styles.tagChipText}>{t} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalBtn, styles.cancelBtn]}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.modalBtn, styles.saveBtn]}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Rounded.xl,
    borderTopRightRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  wordTitle: {
    ...Typography.headlineMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  wordMeaning: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  inputLabel: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  textArea: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    height: 90,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    textAlignVertical: 'top',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  addTagBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagText: {
    ...Typography.labelMd,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 28,
  },
  tagChip: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rounded.full,
  },
  tagChipText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cancelText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.primaryContainer,
  },
  saveText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
