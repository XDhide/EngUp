import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/design';
import { getArticleDetail, submitArticle } from '@/services/reading.service';
import { QuizOptions } from '@/components/reading/QuizOptions';
import { VocabSheet } from '@/components/reading/VocabSheet';
import { ResultBreakdown } from '@/components/reading/ResultBreakdown';

export default function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [selectedVocab, setSelectedVocab] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadArticle(id as string);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const data = await getArticleDetail(articleId);
      setArticle(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!article) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans
      }));
      const res = await submitArticle(article.id, { answers: formattedAnswers });
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContentWithVocab = () => {
    if (!article?.content) return null;
    return (
      <Text style={styles.content}>
        {article.content}
      </Text>
    );
  };

  const openDemoVocab = () => {
    if (article?.vocabularies?.length > 0) {
      setSelectedVocab(article.vocabularies[0]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy bài đọc</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 10}}>
          <Text style={{color: Colors.primary}}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Trở lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{article.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!result ? (
          <>
            <View style={styles.passageCard}>
              {renderContentWithVocab()}
              
              {article.vocabularies?.length > 0 && (
                <TouchableOpacity onPress={openDemoVocab} style={styles.demoVocabBtn}>
                  <Text style={styles.demoVocabText}>Xem từ vựng (Demo)</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.quizSection}>
              <Text style={styles.quizTitle}>Kiểm tra</Text>
              {article.questions?.map((q: any, index: number) => (
                <View key={q.id} style={styles.questionContainer}>
                  <Text style={styles.questionText}>Câu {index + 1}: {q.text}</Text>
                  <QuizOptions 
                    question={q}
                    selected={answers[q.id]}
                    onSelect={(opt) => handleSelectAnswer(q.id, opt)}
                  />
                </View>
              ))}

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Nộp bài</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ResultBreakdown 
            results={result} 
            onRetry={() => loadArticle(article.id)}
            onContinue={() => router.push('/reading-list')}
          />
        )}
      </ScrollView>

      <VocabSheet 
        vocab={selectedVocab}
        onClose={() => setSelectedVocab(null)}
        onSave={(word) => {
          console.log('Saved', word);
          setSelectedVocab(null);
        }}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  passageCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.onSurface,
  },
  demoVocabBtn: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  demoVocabText: {
    color: Colors.primary,
  },
  quizSection: {
    marginTop: Spacing.sm,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  questionContainer: {
    marginBottom: Spacing.xl,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
