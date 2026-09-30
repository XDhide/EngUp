import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing } from '@/constants/design';
import { AudioPlayer } from '@/components/listening/AudioPlayer';
import { DictationInput } from '@/components/listening/DictationInput';
import { DictationResult } from '@/components/listening/DictationResult';
import { getLessonDetail, submitDictation, ListeningLesson, DictationResult as ResultType } from '@/services/listening.service';

const TABS = ['Nghe', 'Chép', 'Kết quả', 'Lịch sử'];

export default function ListeningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lesson, setLesson] = useState<ListeningLesson | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);

  useEffect(() => {
    if (id) {
      fetchLessonDetail();
    }
  }, [id]);

  const fetchLessonDetail = async () => {
    try {
      const res = await getLessonDetail(id as string);
      setLesson(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDictationSubmit = async (text: string) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await submitDictation(id as string, { transcription: text });
      setResult(res);
      setActiveTab('Kết quả');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy bài học.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{lesson.title}</Text>
      </View>

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

      <View style={styles.content}>
        {activeTab === 'Nghe' && (
          <ScrollView>
            <AudioPlayer audioUrl={lesson.audioUrl} />
            {lesson.transcript && (
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptTitle}>Bản dịch / Transcript snippet</Text>
                <Text style={styles.transcriptText}>{lesson.transcript}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {activeTab === 'Chép' && (
          <DictationInput 
            onSubmit={handleDictationSubmit}
            wordCount={lesson.wordCount}
            loading={submitting}
          />
        )}

        {activeTab === 'Kết quả' && result ? (
          <DictationResult 
            result={result}
            onRetry={() => setActiveTab('Chép')}
            onNext={() => router.back()}
            onRate={(rate) => console.log('Rated:', rate)}
          />
        ) : activeTab === 'Kết quả' && !result ? (
          <Text style={styles.placeholderText}>Bạn chưa làm bài chép chính tả.</Text>
        ) : null}

        {activeTab === 'Lịch sử' && (
          <Text style={styles.placeholderText}>Chưa có dữ liệu lịch sử.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  transcriptCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: '#374151',
  },
  transcriptText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: Spacing.xl,
  },
});
