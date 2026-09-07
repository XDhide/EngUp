import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

type Vocabulary = {
  id: string;
  english: string;
  vietnamese: string;
  example: string;
  level: 'Dễ' | 'Trung bình' | 'Khó';
};

const VOCABULARY_DATA: Vocabulary[] = [
  { id: '1',  english: 'Apple',        vietnamese: 'Quả táo',                   example: 'I eat an apple every day.',           level: 'Dễ' },
  { id: '2',  english: 'Beautiful',    vietnamese: 'Đẹp',                       example: 'The sunset is beautiful.',            level: 'Dễ' },
  { id: '3',  english: 'Challenge',    vietnamese: 'Thách thức',                example: 'Learning is a great challenge.',      level: 'Trung bình' },
  { id: '4',  english: 'Diligent',     vietnamese: 'Chăm chỉ',                  example: 'She is a diligent student.',          level: 'Trung bình' },
  { id: '5',  english: 'Enthusiastic', vietnamese: 'Nhiệt tình',                example: 'He is enthusiastic about learning.', level: 'Trung bình' },
  { id: '6',  english: 'Fantastic',    vietnamese: 'Tuyệt vời',                 example: 'The performance was fantastic.',      level: 'Dễ' },
  { id: '7',  english: 'Grateful',     vietnamese: 'Biết ơn',                   example: 'I am grateful for your help.',        level: 'Trung bình' },
  { id: '8',  english: 'Humble',       vietnamese: 'Khiêm tốn',                 example: 'A humble person never brags.',        level: 'Trung bình' },
  { id: '9',  english: 'Inevitable',   vietnamese: 'Không thể tránh khỏi',      example: 'Change is inevitable.',               level: 'Khó' },
  { id: '10', english: 'Jovial',       vietnamese: 'Vui vẻ, hớn hở',            example: 'He has a jovial personality.',        level: 'Khó' },
  { id: '11', english: 'Knowledge',    vietnamese: 'Kiến thức',                 example: 'Knowledge is power.',                level: 'Dễ' },
  { id: '12', english: 'Luminous',     vietnamese: 'Rực rỡ, tỏa sáng',          example: 'The stars are luminous at night.',    level: 'Khó' },
];

const LEVEL_COLORS: Record<Vocabulary['level'], string> = {
  'Dễ': '#34C759',
  'Trung bình': '#FF9500',
  'Khó': '#FF3B30',
};

export default function VocabularyScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  const filtered = VOCABULARY_DATA.filter(
    (v) =>
      v.english.toLowerCase().includes(search.toLowerCase()) ||
      v.vietnamese.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Vocabulary }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.englishWord}>{item.english}</ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level] + '22' }]}>
          <ThemedText style={[styles.levelText, { color: LEVEL_COLORS[item.level] }]}>
            {item.level}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="default" themeColor="textSecondary">
        {item.vietnamese}
      </ThemedText>

      <View style={[styles.exampleBox, { backgroundColor: colors.backgroundSelected }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.exampleText}>
          {item.example}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header với nút quay lại */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Danh sách từ vựng</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {VOCABULARY_DATA.length} từ
          </ThemedText>
        </View>

        {/* Thanh tìm kiếm */}
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.backgroundElement,
              color: colors.text,
              borderColor: searchFocused ? '#4A90D9' : 'transparent',
            },
          ]}
          placeholder="🔍  Tìm kiếm từ vựng..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />

        {/* Danh sách */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText type="default" themeColor="textSecondary">
                Không tìm thấy từ nào
              </ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  searchInput: {
    height: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    borderWidth: 2,
    marginBottom: Spacing.three,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  englishWord: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.five,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exampleBox: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.six,
  },
});
