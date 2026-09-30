import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/design/Colors';
import { Typography } from '@/constants/design/Typography';
import { Spacing } from '@/constants/design/Spacing';
import { Radius } from '@/constants/design/Radius';
import { getOverview, getProgress } from '@/services/statistics.service';
import { WeeklyBarChart } from '@/components/statistics/WeeklyBarChart';
import { SkillProgressList } from '@/components/statistics/SkillProgressList';
import { InsightCard } from '@/components/statistics/InsightCard';
import { StreakBadge } from '@/components/statistics/StreakBadge';

type Period = 'week' | 'month' | 'all';

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [overviewData, progressData] = await Promise.all([
        getOverview(),
        getProgress({ period })
      ]);
      setOverview(overviewData);
      setProgress(progressData);
    } catch (err) {
      setError('Failed to load statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(['week', 'month', 'all'] as Period[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.tab, period === p && styles.activeTab]}
          onPress={() => setPeriod(p)}
        >
          <Text style={[styles.tabText, period === p && styles.activeTabText]}>
            {p === 'week' ? 'Tuần này' : p === 'month' ? 'Tháng này' : 'Toàn bộ'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => {
    if (!overview) return null;
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overview.totalWords}</Text>
          <Text style={styles.summaryLabel}>Từ vựng</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overview.masteredWords}</Text>
          <Text style={styles.summaryLabel}>Thành thạo</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overview.studyStreak}</Text>
          <Text style={styles.summaryLabel}>Ngày học</Text>
          <View style={{marginTop: Spacing.xs}}>
            <StreakBadge streak={overview.studyStreak} />
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Thống kê</Text>
      
      {renderTabs()}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {renderSummaryCards()}

            {progress?.daily && (
              <View style={styles.section}>
                <WeeklyBarChart data={progress.daily} />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Độ thông thạo kỹ năng</Text>
              {overview?.skillProgress && (
                <SkillProgressList skills={overview.skillProgress} />
              )}
            </View>

            {overview && (
              <InsightCard 
                ranking={overview.weeklyRanking}
                comment={overview.weeklyComment || progress?.weeklyComment || ''}
                goalPercent={overview.weeklyGoalPercent}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Colors.onBackground,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: Colors.onPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.lg,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryValue: {
    ...Typography.headlineSmall,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
