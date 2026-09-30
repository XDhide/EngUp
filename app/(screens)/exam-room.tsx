import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/design';
import ExamProgressBar from '@/components/test/ExamProgressBar';
import QuestionCard, { TestQuestion } from '@/components/test/QuestionCard';
import { getQuestions, startAttempt, submitAttempt } from '@/services/test.service';

export default function ExamRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 mins default
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      initExam();
    }
  }, [id]);

  const initExam = async () => {
    try {
      const attemptRes = await startAttempt(id as string);
      setAttemptId(attemptRes.id);
      
      const qRes = await getQuestions(id as string);
      setQuestions(qRes || []);
    } catch (e) {
      // Mock for UI dev
      setQuestions([
        { id: 'q1', passageTitle: 'Reading Passage 1', passageText: 'This is a mock passage text that would be much longer in a real test...', questionText: 'What is the main idea?', options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }, points: 1 },
        { id: 'q2', passageTitle: 'Reading Passage 1', passageText: 'This is a mock passage text that would be much longer in a real test...', questionText: 'According to the text...', options: { A: 'A', B: 'B', C: 'C', D: 'D' }, points: 1 }
      ]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (opt: string) => {
    const qId = questions[currentIndex]?.id;
    if (qId) {
      setAnswers(prev => ({ ...prev, [qId]: opt }));
    }
  };

  const handleSubmit = async () => {
    Alert.alert('Xác nhận nộp bài', 'Bạn có chắc chắn muốn nộp bài ngay?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Nộp bài', style: 'destructive', onPress: async () => {
        try {
          if (attemptId) {
            await submitAttempt(id as string, { answers });
          }
          // Navigate to result
          router.replace({ pathname: '/(screens)/test-result', params: { attemptId: attemptId || 'mock' } });
        } catch (e) {
          router.replace({ pathname: '/(screens)/test-result', params: { attemptId: 'mock' } });
        }
      }}
    ]);
  };

  if (!questions.length) return <View style={styles.container} />;

  const currentQ = questions[currentIndex];
  const answeredIndices = questions.map((q, idx) => answers[q.id] ? idx : -1).filter(i => i !== -1);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Phòng thi', headerBackVisible: false }} />
      
      <ExamProgressBar 
        current={currentIndex} 
        total={questions.length} 
        answered={answeredIndices} 
        timeLeft={formatTime(timeLeft)} 
      />

      <QuestionCard 
        question={currentQ} 
        selected={answers[currentQ.id]} 
        onSelect={handleSelect} 
      />

      <View style={styles.bottomNav}>
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex(prev => prev - 1)}
          >
            <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>Câu trước</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navBtn, currentIndex === questions.length - 1 && styles.navBtnDisabled]}
            disabled={currentIndex === questions.length - 1}
            onPress={() => setCurrentIndex(prev => prev + 1)}
          >
            <Text style={[styles.navBtnText, currentIndex === questions.length - 1 && styles.navBtnTextDisabled]}>Câu tiếp</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Nộp bài ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  bottomNav: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  navBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
  submitBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitBtnText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  }
});
