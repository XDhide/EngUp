import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/design';
import TestSetCard, { TestSet, TestAttempt } from '@/components/test/TestSetCard';
import { getTestSets, getAttempts } from '@/services/test.service';

const TABS = ['Bài thi', 'Lịch sử'];
const FILTERS = ['Tất cả', 'IELTS', 'TOEIC', 'THPT'];

export default function TestListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Bài thi');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  
  const [tests, setTests] = useState<TestSet[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await getTestSets();
      setTests(res || []);
    } catch (e) {
      // Mock data if service fails
      setTests([
        { id: '1', title: 'IELTS Academic Reading Test 1', type: 'IELTS', difficulty: 'Hard', questionCount: 40, duration: 60 },
        { id: '2', title: 'TOEIC Reading Test 1', type: 'TOEIC', difficulty: 'Medium', questionCount: 100, duration: 75 },
      ]);
    }
  };

  const fetchAttempts = async () => {
    try {
      const res = await getAttempts();
      setAttempts(res || []);
    } catch (e) {
      setAttempts([
        { id: 'a1', testId: '1', testTitle: 'IELTS Academic Reading Test 1', bandScore: 6.5, score: 27, total: 40, timeSpent: 3400, createdAt: new Date().toISOString() }
      ]);
    }
  };

  useEffect(() => {
    if (activeTab === 'Lịch sử') {
      fetchAttempts();
    }
  }, [activeTab]);

  const handleStartTest = (testId: string) => {
    router.push({ pathname: '/(screens)/exam-room', params: { id: testId } });
  };

  const filteredTests = activeFilter === 'Tất cả' 
    ? tests 
    : tests.filter(t => t.type === activeFilter);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Luyện đề', headerShadowVisible: false }} />
      
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Bài thi' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.content}>
        {activeTab === 'Bài thi' ? (
          <FlatList
            data={filteredTests}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TestSetCard test={item} onPress={() => handleStartTest(item.id)} />
            )}
          />
        ) : (
          <FlatList
            data={attempts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  {item.bandScore && (
                    <Text style={styles.historyScore}>Band: {item.bandScore}</Text>
                  )}
                </View>
                <Text style={styles.historyTitle}>{item.testTitle}</Text>
                <TouchableOpacity 
                  style={styles.historyBtn} 
                  onPress={() => router.push({ pathname: '/(screens)/test-result', params: { attemptId: item.id } })}
                >
                  <Text style={styles.historyBtnText}>Xem kết quả</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  historyScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.onSurface,
    marginBottom: 12,
  },
  historyBtn: {
    alignSelf: 'flex-start',
  },
  historyBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  }
});
