import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../constants/theme';
import { SessionProgressHeader } from '../components/flashcard/SessionProgressHeader';
import { SRSFlashcard } from '../components/flashcard/SRSFlashcard';
import { RecallButtonGroup } from '../components/flashcard/RecallButtonGroup';
import { reviewService, UserVocabularyCard, ReviewResultType } from '../services/reviewService';
import { errorMessage } from '../services/apiClient';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { AppButton } from '../components/common/AppButton';

export default function FlashcardReviewScreen() {
  const router = useRouter();

  const [cards, setCards] = useState<UserVocabularyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thời điểm thẻ hiện tại xuất hiện (đo thời gian phản hồi thật) và thời điểm bắt đầu phiên.
  const cardShownAt = useRef(0);
  const sessionStartedAt = useRef(0);

  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const loadReviewCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewService.getTodayReviews();
      setCards(res.cards);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách thẻ cần ôn.'));
    } finally {
      setLoading(false);
      cardShownAt.current = Date.now();
      sessionStartedAt.current = Date.now();
    }
  }, []);

  useEffect(() => {
    loadReviewCards();
  }, [loadReviewCards]);

  const currentCard = cards[currentIndex];

  const handleRecall = async (result: ReviewResultType) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await reviewService.submitReview({
        card_id: currentCard.id,
        result,
        response_time_ms: Math.max(0, Date.now() - cardShownAt.current),
      });
    } catch (e) {
      // Không chuyển thẻ nếu server chưa ghi nhận, để người học thử lại.
      setError(errorMessage(e, 'Không gửi được đánh giá. Vui lòng thử lại.'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    const nextStats = { ...stats, [result]: stats[result] + 1 };
    setStats(nextStats);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      cardShownAt.current = Date.now();
    } else {
      router.replace({
        pathname: '/review-summary',
        params: {
          total: String(cards.length),
          again: String(nextStats.again),
          hard: String(nextStats.hard),
          good: String(nextStats.good),
          easy: String(nextStats.easy),
          seconds: String(Math.round((Date.now() - sessionStartedAt.current) / 1000)),
        },
      });
    }
  };

  const handleExit = () => {
    Alert.alert('Thoát phiên ôn tập', 'Tiến trình các thẻ đã làm sẽ được lưu lại.', [
      { text: 'Tiếp tục học', style: 'cancel' },
      { text: 'Thoát', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerPadding}>
        <SessionProgressHeader
          currentIndex={currentIndex + 1}
          totalCount={cards.length}
          onExit={handleExit}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : currentCard && currentCard.word ? (
          <View style={styles.cardWrapper}>
            <SRSFlashcard
              word={currentCard.word}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              srsStage={currentCard.repetitions || 1}
              recallProbability={currentCard.recall_probability}
            />

            <View style={styles.recallSection}>
              <Text style={styles.recallHint}>
                {isFlipped
                  ? 'Đánh giá mức độ ghi nhớ của bạn:'
                  : 'Chạm vào thẻ để lật xem nghĩa trước khi đánh giá:'}
              </Text>

              <RecallButtonGroup
                onSelect={handleRecall}
                disabled={submitting}
              />
            </View>
          </View>
        ) : cards.length === 0 && error ? (
          <AppButton title="Thử tải lại" onPress={loadReviewCards} />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Tuyệt vời! Không có từ nào cần ôn</Text>
            <Text style={styles.emptyDesc}>
              Bạn đã hoàn thành tất cả các từ cần ôn hôm nay.
            </Text>
          </View>
        )}

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
  headerPadding: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
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
  cardWrapper: {
    gap: Spacing.lg,
  },
  recallSection: {
    gap: Spacing.sm,
  },
  recallHint: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
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
    height: Spacing.xl,
  },
});
