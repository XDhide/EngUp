import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { router } from 'expo-router';

export default function PracticeScreen() {
  const navigateTo = (route: any) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Luyện tập</Text>
      
      <View style={styles.grid}>
        <Pressable style={styles.card} onPress={() => navigateTo('/listening-list')}>
          <Text style={styles.cardTitle}>Bài nghe</Text>
          <Text style={styles.cardDesc}>Luyện kỹ năng nghe</Text>
        </Pressable>
        
        <Pressable style={styles.card} onPress={() => navigateTo('/reading-list')}>
          <Text style={styles.cardTitle}>Bài đọc</Text>
          <Text style={styles.cardDesc}>Luyện kỹ năng đọc</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigateTo('/writing')}>
          <Text style={styles.cardTitle}>Luyện viết</Text>
          <Text style={styles.cardDesc}>Luyện kỹ năng viết</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigateTo('/test-list')}>
          <Text style={styles.cardTitle}>Luyện đề</Text>
          <Text style={styles.cardDesc}>Làm bài test tổng hợp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
