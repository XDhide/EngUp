import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { NotebookSearchHeader } from '../../components/notebook/NotebookSearchHeader';
import { NotebookFilterRow } from '../../components/notebook/NotebookFilterRow';
import { NotebookWordCard } from '../../components/notebook/NotebookWordCard';
import { NotebookEditModal } from '../../components/notebook/NotebookEditModal';
import { NotebookAddWordModal } from '../../components/notebook/NotebookAddWordModal';
import { notebookService, NotebookEntry } from '../../services/notebookService';
import { VocabularyWord } from '../../services/vocabularyService';
import { errorMessage } from '../../services/apiClient';

export default function NotebookScreen() {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  // Lọc theo nguồn ở server; tìm kiếm chữ làm ở client (backend chưa hỗ trợ).
  const loadEntries = useCallback(async () => {
    try {
      const res = await notebookService.getEntries({ source_type: selectedFilter });
      setEntries(res.entries);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được sổ tay.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const handleEdit = (entry: NotebookEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xác nhận xoá', 'Bạn có chắc chắn muốn xoá từ này khỏi sổ tay?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await notebookService.deleteEntry(id);
            setEntries((prev) => prev.filter((item) => item.id !== id));
          } catch (e) {
            Alert.alert('Không xoá được', errorMessage(e));
          }
        },
      },
    ]);
  };

  const handleSaveModal = async (id: number, data: { note: string; tags: string[] }) => {
    try {
      await notebookService.updateEntry(id, data);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, note: data.note, tags: data.tags } : e))
      );
    } catch (e) {
      Alert.alert('Không lưu được', errorMessage(e));
      throw e;
    }
  };

  const handleAddWord = async (word: VocabularyWord) => {
    await notebookService.addEntry({ word_id: word.id, source_type: 'manual' });
    await loadEntries();
  };

  const savedWordIds = useMemo(() => new Set(entries.map((e) => e.word_id)), [entries]);

  const filteredEntries = entries.filter((e) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      query === '' ||
      e.word?.word?.toLowerCase().includes(query) ||
      e.word?.meaning?.toLowerCase().includes(query) ||
      e.note?.toLowerCase().includes(query) ||
      (e.tags && e.tags.some((t) => t.toLowerCase().includes(query)))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Sổ Tay" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <NotebookSearchHeader
          totalCount={entries.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
        />

        <NotebookFilterRow selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} />

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Chưa có từ nào trong mục này</Text>
            <Text style={styles.emptyDesc}>
              Hãy bấm &quot;Lưu sổ tay&quot; trong các bài đọc hoặc bài học, hoặc dùng nút &quot;Thêm từ mới&quot;.
            </Text>
          </View>
        ) : (
          <View style={styles.wordList}>
            {filteredEntries.map((entry) => (
              <NotebookWordCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>Thêm từ mới</Text>
      </TouchableOpacity>

      <NotebookEditModal
        visible={modalVisible}
        entry={selectedEntry}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveModal}
      />

      <NotebookAddWordModal
        visible={addVisible}
        savedWordIds={savedWordIds}
        onClose={() => setAddVisible(false)}
        onAdd={handleAddWord}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  wordList: {
    gap: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  emptyDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: 96,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Spacing.lg,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Rounded.full,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: {
    ...Typography.labelMd,
    color: Colors.onPrimaryContainer,
    fontWeight: '700',
  },
});
