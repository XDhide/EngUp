import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { FlashCard, ReviewCard } from '@/components/vocabulary/FlashCard';
import { TopicChip, Topic } from '@/components/vocabulary/TopicChip';
import { WordListItem, Word } from '@/components/vocabulary/WordListItem';
import { SRSRecallBar } from '@/components/common/SRSRecallBar';
import { getNewWords, getTodayReviewCards, submitReview, getTopics, getWords } from '@/services/vocabulary.service';

export default function VocabularyScreen() {
  const [activeTab, setActiveTab] = useState<'today' | 'library' | 'explore'>('today');
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [libraryWords, setLibraryWords] = useState<Word[]>([]);
  const [exploreWords, setExploreWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cards = await getTodayReviewCards();
      setReviewCards(cards || []);
      const t = await getTopics();
      setTopics(t || []);
      const res = await getWords();
      setLibraryWords(res?.words || []);
      const ew = await getNewWords();
      setExploreWords(ew || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReview = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (reviewCards[currentCardIndex]) {
      await submitReview({ cardId: reviewCards[currentCardIndex].id, rating });
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const renderToday = () => {
    const card = reviewCards[currentCardIndex];
    const total = reviewCards.length;

    if (!card || currentCardIndex >= total) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.celebrationText}>Bạn đã hoàn thành bài học hôm nay! 🎉</Text>
        </View>
      );
    }

    return (
      <View style={styles.todayContainer}>
        <Text style={styles.progressText}>{currentCardIndex + 1}/{total} thẻ hôm nay</Text>
        <FlashCard card={card} />
        <View style={styles.recallBarContainer}>
          <SRSRecallBar onRate={handleReview} />
        </View>
      </View>
    );
  };

  const renderLibrary = () => (
    <View style={styles.libraryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll} contentContainerStyle={styles.topicsContent}>
        {topics.map(t => (
          <TopicChip
            key={t.id}
            topic={t}
            selected={selectedTopic === t.id}
            onPress={() => setSelectedTopic(t.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm từ vựng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView>
        {libraryWords.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase())).map(w => (
          <WordListItem key={w.id} word={w} />
        ))}
      </ScrollView>
    </View>
  );

  const renderExplore = () => (
    <ScrollView style={styles.exploreContainer}>
      <Text style={styles.sectionTitle}>Từ mới hôm nay</Text>
      {exploreWords.map(w => (
        <WordListItem key={w.id} word={w} />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabsHeader}>
        {(['today', 'library', 'explore'] as const).map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'today' ? 'Hôm nay' : tab === 'library' ? 'Thư viện' : 'Khám phá'}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <View style={styles.content}>
        {activeTab === 'today' && renderToday()}
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'explore' && renderExplore()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  tabsHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  todayContainer: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  progressText: {
    marginBottom: Spacing.lg,
    color: Colors.onSurfaceVariant,
  },
  recallBarContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
  },
  libraryContainer: {
    flex: 1,
  },
  topicsScroll: {
    maxHeight: 50,
  },
  topicsContent: {
    padding: Spacing.md,
  },
  searchContainer: {
    padding: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  exploreContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
});

