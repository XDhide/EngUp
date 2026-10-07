import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { vocabularyService, VocabularyWord } from '../../services/vocabularyService';
import { errorMessage } from '../../services/apiClient';
import { ErrorBanner } from '../common/ErrorBanner';

interface NotebookAddWordModalProps {
  visible: boolean;
  /** word_id đã có trong sổ tay (để đánh dấu, tránh thêm trùng) */
  savedWordIds: Set<number>;
  onClose: () => void;
  onAdd: (word: VocabularyWord) => Promise<void>;
}

const LOAD_LIMIT = 200;

// Backend chỉ cho thêm từ đã có trong kho từ vựng (word_id), nên "Thêm từ mới" là chọn từ trong kho.
export const NotebookAddWordModal: React.FC<NotebookAddWordModalProps> = ({
  visible,
  savedWordIds,
  onClose,
  onAdd,
}) => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setError(null);
    setLoading(true);
    vocabularyService
      .getWords({ limit: LOAD_LIMIT })
      .then((r) => setWords(r.words))
      .catch((e) => setError(errorMessage(e, 'Không tải được kho từ vựng.')))
      .finally(() => setLoading(false));
  }, [visible]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
    );
  }, [words, query]);

  const handleAdd = async (word: VocabularyWord) => {
    setBusyId(word.id);
    setError(null);
    try {
      await onAdd(word);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Thêm từ vào sổ tay</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Tìm từ hoặc nghĩa tiếng Việt..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />

          {error && <ErrorBanner message={error} />}

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(w) => String(w.id)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy từ phù hợp.</Text>}
              renderItem={({ item }) => {
                const saved = savedWordIds.has(item.id);
                return (
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.word}>{item.word}</Text>
                      <Text style={styles.meaning} numberOfLines={1}>
                        {item.meaning}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={saved || busyId === item.id}
                      onPress={() => handleAdd(item)}
                      style={[styles.addBtn, saved && styles.addBtnDisabled]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.addText, saved && styles.addTextDisabled]}>
                        {saved ? 'Đã lưu' : busyId === item.id ? '...' : 'Thêm'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18, 28, 42, 0.4)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Rounded.xl,
    borderTopRightRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Typography.titleSm, color: Colors.onSurface },
  closeBtn: { padding: 4 },
  closeText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  search: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  loader: { marginVertical: Spacing.lg },
  list: { flexGrow: 0 },
  empty: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', padding: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondaryContainer,
  },
  rowText: { flex: 1 },
  word: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  meaning: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  addBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Rounded.full,
  },
  addBtnDisabled: { backgroundColor: Colors.secondaryContainer },
  addText: { ...Typography.labelMd, color: Colors.onPrimaryContainer, fontWeight: '700' },
  addTextDisabled: { color: Colors.onSurfaceVariant },
});
