import React, { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { StreakBanner } from '../../components/home/StreakBanner';
import { ReviewActionCard } from '../../components/home/ReviewActionCard';
import { DailyNewWordCard } from '../../components/home/DailyNewWordCard';
import { PracticeSkillsGrid } from '../../components/home/PracticeSkillsGrid';
import { LearningTargetCard } from '../../components/home/LearningTargetCard';
import { reviewService } from '../../services/reviewService';
import { vocabularyService } from '../../services/vocabularyService';
import { statsService } from '../../services/statsService';
import { errorMessage } from '../../services/apiClient';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [newWordsCount, setNewWordsCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(user?.daily_new_word_limit ?? 10);
  const [streak, setStreak] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const loadData = useCallback(async () => {
    const [review, newWords, overview, progress] = await Promise.allSettled([
      reviewService.getTodayReviews(),
      vocabularyService.getNewWords(),
      statsService.getOverview(),
      statsService.getProgress('7d'),
    ]);

    if (review.status === 'fulfilled') setReviewCount(review.value.count);
    if (newWords.status === 'fulfilled') {
      setNewWordsCount(newWords.value.learned_today);
      setDailyLimit(newWords.value.daily_limit);
    }
    if (overview.status === 'fulfilled') setStreak(overview.value.current_streak);
    if (progress.status === 'fulfilled') {
      // Phần tử cuối của timeline là hôm nay.
      const last = progress.value.timeline[progress.value.timeline.length - 1];
      setTodayMinutes(last ? last.minutes_studied : 0);
    }

    const failed = [review, newWords, overview, progress].find((r) => r.status === 'rejected');
    setError(failed && failed.status === 'rejected' ? errorMessage(failed.reason) : null);
  }, []);

  // Tải lại mỗi khi quay về tab (ví dụ sau khi ôn tập xong).
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Trang Chủ" />

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
        {error && <ErrorBanner message={error} />}

        <StreakBanner
          userName={user?.full_name?.trim().split(/\s+/).pop() || 'Học viên'}
          streakCount={streak}
        />

        <ReviewActionCard
          reviewCount={reviewCount}
          onPress={() => router.push('/flashcard')}
        />

        <DailyNewWordCard
          currentCount={newWordsCount}
          targetLimit={dailyLimit}
          onPress={() => router.push('/daily-words')}
        />

        <PracticeSkillsGrid />

        <LearningTargetCard
          currentMinutes={todayMinutes}
          targetMinutes={user?.daily_target_minutes ?? 15}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    gap: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
