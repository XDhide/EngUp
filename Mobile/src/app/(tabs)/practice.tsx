import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { AppHeader } from '../../components/common/AppHeader';
import { ReadingPanel } from '../../components/practice/ReadingPanel';
import { ListeningPanel } from '../../components/practice/ListeningPanel';
import { WritingPanel } from '../../components/practice/WritingPanel';
import { TestPanel } from '../../components/practice/TestPanel';

type Skill = 'reading' | 'listening' | 'writing' | 'test';

const SKILLS: Array<{ id: Skill; label: string }> = [
  { id: 'reading', label: 'Đọc hiểu' },
  { id: 'listening', label: 'Nghe chép' },
  { id: 'writing', label: 'Viết AI' },
  { id: 'test', label: 'Luyện đề' },
];

const isSkill = (v: unknown): v is Skill => SKILLS.some((s) => s.id === v);

export default function PracticeScreen() {
  const params = useLocalSearchParams();
  const [activeSkill, setActiveSkill] = useState<Skill>(isSkill(params.tab) ? params.tab : 'reading');
  // Kéo để làm mới: tăng khoá để panel đang hiển thị tự tải lại.
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isSkill(params.tab)) setActiveSkill(params.tab);
  }, [params.tab]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };
  const onLoaded = useCallback(() => setRefreshing(false), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Luyện Tập" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.headerGroup}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>KỸ NĂNG NGÔN NGỮ</Text>
            <View style={styles.srsPill}>
              <Text style={styles.srsPillText}>SRS Practice</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Rèn luyện phản xạ đọc hiểu, nghe, viết và làm đề qua ngữ cảnh thực tế.
          </Text>
        </View>

        <View style={styles.skillTabBar}>
          {SKILLS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.skillTab, activeSkill === s.id && styles.skillTabActive]}
              onPress={() => setActiveSkill(s.id)}
            >
              <Text style={[styles.skillTabText, activeSkill === s.id && styles.skillTabTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeSkill === 'reading' && <ReadingPanel refreshKey={refreshKey} onLoaded={onLoaded} />}
        {activeSkill === 'listening' && <ListeningPanel refreshKey={refreshKey} onLoaded={onLoaded} />}
        {activeSkill === 'writing' && <WritingPanel refreshKey={refreshKey} onLoaded={onLoaded} />}
        {activeSkill === 'test' && <TestPanel refreshKey={refreshKey} onLoaded={onLoaded} />}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  headerGroup: { gap: Spacing.xs },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeText: { ...Typography.labelSm, color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
  srsPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
  },
  srsPillText: { ...Typography.labelSm, color: Colors.onSecondaryContainer, fontWeight: '700' },
  subtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  skillTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: 4,
    gap: 4,
  },
  skillTab: { flex: 1, height: 38, borderRadius: Rounded.sm, alignItems: 'center', justifyContent: 'center' },
  skillTabActive: { backgroundColor: Colors.surfaceContainerLowest, elevation: 1 },
  skillTabText: { ...Typography.labelSm, color: Colors.onSurfaceVariant, fontWeight: '600' },
  skillTabTextActive: { color: Colors.onSurface, fontWeight: '700' },
  bottomSpacer: { height: Spacing.xl },
});
