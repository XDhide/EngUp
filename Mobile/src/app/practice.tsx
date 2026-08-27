import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

type Question = {
  vietnamese: string;
  correct: string;
  options: string[];
};

const ALL_WORDS = [
  { english: 'Apple',        vietnamese: 'Quả táo' },
  { english: 'Beautiful',    vietnamese: 'Đẹp' },
  { english: 'Challenge',    vietnamese: 'Thách thức' },
  { english: 'Diligent',     vietnamese: 'Chăm chỉ' },
  { english: 'Enthusiastic', vietnamese: 'Nhiệt tình' },
  { english: 'Fantastic',    vietnamese: 'Tuyệt vời' },
  { english: 'Grateful',     vietnamese: 'Biết ơn' },
  { english: 'Humble',       vietnamese: 'Khiêm tốn' },
  { english: 'Inevitable',   vietnamese: 'Không thể tránh khỏi' },
  { english: 'Jovial',       vietnamese: 'Vui vẻ, hớn hở' },
  { english: 'Knowledge',    vietnamese: 'Kiến thức' },
  { english: 'Luminous',     vietnamese: 'Rực rỡ, tỏa sáng' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestion(index: number): Question {
  const wordIndex = index % ALL_WORDS.length;
  const word = ALL_WORDS[wordIndex];
  const others = shuffle(ALL_WORDS.filter((_, i) => i !== wordIndex)).slice(0, 3);
  const options = shuffle([word, ...others]).map((w) => w.english);
  return {
    vietnamese: word.vietnamese,
    correct: word.english,
    options,
  };
}

type OptionState = 'idle' | 'correct' | 'wrong';

export default function PracticeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => buildQuestion(0));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const cardAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (questionIndex % ALL_WORDS.length) / ALL_WORDS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [questionIndex]);

  const getOptionState = (option: string): OptionState => {
    if (!selected) return 'idle';
    if (option === question.correct) return 'correct';
    if (option === selected) return 'wrong';
    return 'idle';
  };

  const handleSelect = (option: string) => {
    if (selected) return;

    setSelected(option);
    setTotal((t) => t + 1);
    if (option === question.correct) setScore((s) => s + 1);

    setTimeout(() => {
      Animated.sequence([
        Animated.timing(cardAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setQuestion(buildQuestion(nextIndex));
      setSelected(null);
    }, 1500);
  };

  const getOptionColors = (state: OptionState) => {
    switch (state) {
      case 'correct': return { bg: '#34C759', border: '#2DAB4A', text: '#ffffff' };
      case 'wrong':   return { bg: '#FF3B30', border: '#D9362B', text: '#ffffff' };
      default:        return { bg: colors.backgroundElement, border: 'transparent', text: colors.text };
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
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
          <ThemedText style={styles.headerTitle}>🎯 Ôn tập từ vựng</ThemedText>
          <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText type="smallBold">✅ {score}/{total}</ThemedText>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.backgroundElement }]}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth, backgroundColor: '#4A90D9' }]}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.progressLabel}>
          Câu {(questionIndex % ALL_WORDS.length) + 1} / {ALL_WORDS.length}
        </ThemedText>

        {/* Question card */}
        <Animated.View style={[styles.questionCard, { opacity: cardAnim, transform: [{ scale: cardAnim }] }]}>
          <ThemedView type="backgroundElement" style={styles.questionInner}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.questionLabel}>
              TỪ TIẾNG VIỆT
            </ThemedText>
            <ThemedText style={styles.vietnameseWord}>
              {question.vietnamese}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Chọn nghĩa tiếng Anh đúng bên dưới
            </ThemedText>
          </ThemedView>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option) => {
            const state = getOptionState(option);
            const c = getOptionColors(state);
            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: c.bg,
                    borderColor: c.border,
                    borderWidth: 2,
                    opacity: pressed && !selected ? 0.85 : 1,
                  },
                ]}
                onPress={() => handleSelect(option)}
                disabled={!!selected}
              >
                <ThemedText style={[styles.optionText, { color: c.text }]}>
                  {option}
                </ThemedText>
                {state === 'correct' && (
                  <ThemedText style={styles.feedbackIcon}>✓</ThemedText>
                )}
                {state === 'wrong' && (
                  <ThemedText style={styles.feedbackIcon}>✗</ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Kết quả phản hồi */}
        {selected && (
          <View style={styles.resultMessage}>
            {selected === question.correct ? (
              <ThemedText style={[styles.resultText, { color: '#34C759' }]}>
                🎉 Chính xác! Tiếp tục nào...
              </ThemedText>
            ) : (
              <ThemedText style={[styles.resultText, { color: '#FF3B30' }]}>
                ❌ Sai rồi! Đáp án đúng là "{question.correct}"
              </ThemedText>
            )}
          </View>
        )}

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
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
  scoreBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.one,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    textAlign: 'right',
    marginBottom: Spacing.three,
    fontSize: 12,
  },
  questionCard: {
    marginBottom: Spacing.three,
  },
  questionInner: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 150,
    justifyContent: 'center',
  },
  questionLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
  vietnameseWord: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
  },
  optionsContainer: {
    gap: Spacing.two,
    flex: 1,
  },
  optionButton: {
    flex: 1,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 54,
    maxHeight: 70,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  feedbackIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  resultMessage: {
    paddingTop: Spacing.two,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
