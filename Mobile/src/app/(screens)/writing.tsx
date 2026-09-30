import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/design';
import WritingPromptCard, { WritingPrompt } from '@/components/writing/WritingPromptCard';
import WritingEditor from '@/components/writing/WritingEditor';
import WritingFeedback from '@/components/writing/WritingFeedback';
import SubmissionHistoryItem from '@/components/writing/SubmissionHistoryItem';
import { WritingSubmission } from '@/components/writing/WritingFeedback';
import { getPrompts, createSubmission, getSubmissions } from '@/services/writing.service';

const TABS = ['Chủ đề', 'Viết', 'Kết quả', 'Bài đã nộp'];

export default function WritingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Chủ đề');
  
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<WritingSubmission | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await getPrompts();
      setPrompts(res);
    } catch (e) {}
  };

  const fetchHistory = async () => {
    try {
      const res = await getSubmissions();
      setHistory(res);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'Bài đã nộp') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleStartWriting = (prompt: WritingPrompt) => {
    setSelectedPrompt(prompt);
    setActiveTab('Viết');
  };

  const handleSubmit = async (content: string) => {
    if (!selectedPrompt) return;
    setLoading(true);
    try {
      const res = await createSubmission({ promptId: selectedPrompt.id, content });
      setCurrentSubmission(res);
      setActiveTab('Kết quả');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Chủ đề':
        return (
          <FlatList
            data={prompts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <WritingPromptCard prompt={item} onStart={() => handleStartWriting(item)} />
            )}
          />
        );
      case 'Viết':
        if (!selectedPrompt) {
          return (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Vui lòng chọn một chủ đề trước</Text>
            </View>
          );
        }
        return (
          <WritingEditor 
            prompt={selectedPrompt} 
            onSubmit={handleSubmit} 
            loading={loading} 
          />
        );
      case 'Kết quả':
        if (!currentSubmission) {
          return (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Chưa có kết quả</Text>
            </View>
          );
        }
        return (
          <WritingFeedback 
            submission={currentSubmission}
            onRetry={() => setActiveTab('Viết')}
            onSave={() => console.log('Saved')}
          />
        );
      case 'Bài đã nộp':
        return (
          <FlatList
            data={history}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <SubmissionHistoryItem 
                submission={item} 
                onView={() => {
                  setCurrentSubmission(item);
                  setActiveTab('Kết quả');
                }} 
              />
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Luyện viết', headerShadowVisible: false }} />
      
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

      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

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
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  }
});
