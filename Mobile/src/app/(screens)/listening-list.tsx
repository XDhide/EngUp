import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/design';
import { LessonCard } from '@/components/listening/LessonCard';
import { getLessons, ListeningLesson } from '@/services/listening.service';

const TABS = ['Tất cả', 'Đang học', 'Hoàn thành'];

export default function ListeningListScreen() {
  const [lessons, setLessons] = useState<ListeningLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await getLessons({ filter: activeTab });
      if (res && res.lessons) {
        setLessons(res.lessons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Danh sách bài nghe</Text>
      
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <Pressable 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={lessons}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLessons} />}
        renderItem={({ item }) => (
          <LessonCard 
            lesson={item} 
            onPress={() => router.push(`/listening-detail?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={() => (
          !loading ? <Text style={styles.emptyText}>Chưa có bài nghe nào.</Text> : null
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.lg,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: Spacing.xl,
  },
});
