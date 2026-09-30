import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/design';
import TestResult, { TestResultType } from '@/components/test/TestResult';
import { getAttemptResult } from '@/services/test.service';

export default function TestResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  
  const [result, setResult] = useState<TestResultType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const res = await getAttemptResult(attemptId as string);
      setResult(res);
    } catch (e) {
      // Mock result
      setResult({
        attemptId: attemptId as string,
        bandScore: 6.5,
        correctCount: 27,
        totalCount: 40,
        accuracy: 67.5,
        timeSpent: 3400,
        passageResults: [
          { title: 'Passage 1: The History of Glass', correct: 10, total: 13, percentage: 76 },
          { title: 'Passage 2: Bring Back the Big Cats', correct: 9, total: 13, percentage: 69 },
          { title: 'Passage 3: UK Companies Need More Effective Boards', correct: 8, total: 14, percentage: 57 }
        ],
        aiComment: 'Bạn có kỹ năng đọc hiểu khá tốt, đặc biệt ở dạng bài Multiple Choice. Tuy nhiên cần cải thiện tốc độ đọc và luyện tập thêm dạng True/False/Not Given ở Passage 3.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !result) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Kết quả thi', headerBackVisible: false }} />
      <TestResult 
        result={result}
        onRetry={() => router.replace({ pathname: '/(screens)/test-list' })}
        onViewDetail={() => console.log('View detail')}
        onBack={() => router.replace({ pathname: '/(screens)/test-list' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
