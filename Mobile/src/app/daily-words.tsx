import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { ProgressBar } from '../components/common/ProgressBar';
import { DailyTargetStepper } from '../components/flashcard/DailyTargetStepper';
import { vocabularyService, VocabularyWord } from '../services/vocabularyService';
import { errorMessage } from '../services/apiClient';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { notebookService } from '../services/notebookService';

export default function DailyWordsScreen() {
  const router = useRouter();

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNewWords = useCallback(async () => {
    try {
      const res = await vocabularyService.getNewWords();
      setWords(res.words);
      setDailyLimit(res.daily_limit);
      setLearnedCount(res.learned_today);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được từ mới.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewWords();
  }, [loadNewWords]);

  const currentWord = words[currentIndex];
  const progressRatio = dailyLimit > 0 ? Math.min(learnedCount / dailyLimit, 1) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const finishSession = (learned: number) => {
    Alert.alert(
      'Hoàn thành phiên học',
      `Bạn đã học xong các từ mới hôm nay! Tổng cộng: ${learned} từ.`,
      [{ text: 'Về trang chủ', onPress: () => router.replace('/(tabs)') }]
    );
  };

  // "Học từ này" = lưu vào sổ tay; backend sẽ tự tạo thẻ SRS cho từ đó.
  const handleNextWord = async (shouldLearn: boolean) => {
    if (busy) return;
    let learned = learnedCount;

    if (shouldLearn && currentWord) {
      setBusy(true);
      try {
        await notebookService.addEntry({
          word_id: currentWord.id,
          source_type: 'vocabulary',
          note: 'Học từ phiên từ mới hàng ngày',
        });
        learned += 1;
        setLearnedCount(learned);
        setError(null);
      } catch (e) {
        setError(errorMessage(e, 'Không lưu được từ này. Vui lòng thử lại.'));
        setBusy(false);
        return; // giữ nguyên thẻ hiện tại để người học thử lại
      }
      setBusy(false);
    }

    if (currentIndex < words.length - 1) setCurrentIndex((prev) => prev + 1);
    else finishSession(learned);
  };

  const handleUpdateLimit = async (newLimit: number) => {
    try {
      await vocabularyService.updateDailyNewWordLimit(newLimit);
      setDailyLimit(newLimit);
      Alert.alert('Thành công', `Đã cập nhật chỉ tiêu: ${newLimit} từ mỗi ngày.`);
    } catch (e) {
      Alert.alert('Không cập nhật được', errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Phiên Học SRS"
        showBack
        backLabel="Đóng"
        onBack={() => router.replace('/(tabs)')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && <ErrorBanner message={error} />}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressTitle}>
              Từ mới hôm nay: {learnedCount}/{dailyLimit}
            </Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
          </View>

          <ProgressBar progress={progressRatio} height={6} />

          <Text style={styles.targetHint}>
            Mục tiêu {dailyLimit} từ hôm nay · Đã chọn học {learnedCount} từ
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : currentWord ? (
          <>
            {/* Big Interactive SRS Flashcard */}
            <View style={styles.flashcard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardMeta}>TỪ MỚI TIẾP THEO</Text>
                <View style={styles.cardIndexBadge}>
                  <Text style={styles.cardIndexText}>
                    Thẻ {currentIndex + 1} trên {words.length}
                  </Text>
                </View>
              </View>

              <View style={styles.wordSection}>
                <Text style={styles.headword}>{currentWord.word}</Text>
                <View style={styles.phoneticRow}>
                  {currentWord.difficulty && (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>[{currentWord.difficulty.toUpperCase()}]</Text>
                    </View>
                  )}
                  {currentWord.phonetic && (
                    <Text style={styles.phoneticText}>{currentWord.phonetic}</Text>
                  )}
                </View>
              </View>

              {/* Meaning Block */}
              <View style={styles.meaningBox}>
                <Text style={styles.meaningLabel}>Ý NGHĨA CHÍNH</Text>
                <Text style={styles.meaningText}>{currentWord.meaning}</Text>
              </View>

              {/* Example Block */}
              {currentWord.example_sentence && (
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleLabel}>VÍ DỤ THỰC TẾ</Text>
                  <Text style={styles.exampleText}>&quot;{currentWord.example_sentence}&quot;</Text>
                </View>
              )}

              <Text style={styles.swipeHint}>
                Bấm &quot;Đã biết&quot; để bỏ qua · Bấm &quot;Học từ này&quot; để ghi nhớ vào SRS
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnSkip]}
                onPress={() => handleNextWord(false)}
                disabled={busy}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSkipText}>Đã biết</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnLearn]}
                onPress={() => handleNextWord(true)}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={styles.btnLearnText}>Học từ này</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.flashcard}>
            <Text style={styles.headword}>Hết từ mới</Text>
            <Text style={styles.swipeHint}>
              Bạn đã học hết từ mới hiện có. Hãy quay lại sau hoặc ôn tập các từ đến hạn.
            </Text>
          </View>
        )}

        {/* Stepper Settings */}
        <DailyTargetStepper
          initialLimit={dailyLimit}
          onSave={handleUpdateLimit}
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
  progressSection: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  percentBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
  },
  percentText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  targetHint: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  flashcard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardIndexBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  cardIndexText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  wordSection: {
    gap: 4,
  },
  headword: {
    ...Typography.headlineLg,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.sm,
  },
  typeText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  phoneticText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontFamily: 'monospace',
  },
  meaningBox: {
    backgroundColor: 'rgba(202, 234, 214, 0.4)',
    borderRadius: Rounded.md,
    padding: Spacing.md,
    gap: 4,
  },
  meaningLabel: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  meaningText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    lineHeight: 22,
  },
  exampleBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    gap: 4,
  },
  exampleLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '700',
  },
  exampleText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  swipeHint: {
    ...Typography.labelSm,
    color: Colors.outline,
    textAlign: 'center',
    paddingTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSkip: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  btnSkipText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  btnLearn: {
    backgroundColor: Colors.primaryContainer,
  },
  btnLearnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
