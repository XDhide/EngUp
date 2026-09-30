import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { router } from 'expo-router';
import { getMe } from '@/services/auth.service';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getMe();
      setUser(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.name?.split(' ')[0] || 'bạn'}!</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 7 ngày</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiếp tục hôm nay</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>30 phút hôm nay</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>
        </View>
      </View>

      <Pressable style={styles.srsCard} onPress={() => router.push('/vocabulary')}>
        <Text style={styles.srsTitle}>20 thẻ ôn tập hôm nay</Text>
        <Text style={styles.srsAction}>Bắt đầu ôn tập →</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        <View style={styles.quickAccessGrid}>
          {['Listening', 'Reading', 'Writing', 'Test'].map(item => (
            <Pressable key={item} style={styles.quickAccessTile} onPress={() => router.push('/practice')}>
              <Text style={styles.quickAccessText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chuỗi ngày học</Text>
        <View style={styles.calendarRow}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => (
            <View key={day} style={styles.dayCol}>
              <View style={[styles.dayCircle, i < 5 ? styles.dayCircleDone : null]} />
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  streakBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  streakText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  progressCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  progressText: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  srsCard: {
    margin: Spacing.md,
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  srsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSecondaryFixed,
    marginBottom: Spacing.sm,
  },
  srsAction: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessTile: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  quickAccessText: {
    fontWeight: '600',
    color: Colors.onSurface,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    marginBottom: Spacing.xs,
  },
  dayCircleDone: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
});
