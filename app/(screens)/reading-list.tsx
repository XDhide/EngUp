import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/design';
import { getArticles } from '@/services/reading.service';
import { ArticleCard } from '@/components/reading/ArticleCard';

export default function ReadingListScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArticles = async () => {
    try {
      const res = await getArticles();
      setArticles(res.articles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticles();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bài đọc hiểu</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard 
            article={item} 
            onPress={() => router.push(`/reading-detail?id=${item.id}`)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.onSurface,
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  listContent: {
    padding: Spacing.md,
  }
});
