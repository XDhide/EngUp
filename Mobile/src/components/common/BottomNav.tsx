import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/design';

type Tab = 'home' | 'vocabulary' | 'practice' | 'stats' | 'profile';

interface BottomNavProps {
  active: Tab;
}

const TABS: { id: Tab; label: string; route: string }[] = [
  { id: 'home', label: 'Trang chủ', route: '/(tabs)/' },
  { id: 'vocabulary', label: 'Từ vựng', route: '/(tabs)/vocabulary' },
  { id: 'practice', label: 'Luyện tập', route: '/(tabs)/practice' },
  { id: 'stats', label: 'Thống kê', route: '/(tabs)/stats' },
  { id: 'profile', label: 'Cá nhân', route: '/(tabs)/profile' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: Colors.surfaceContainerLowest,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '400',
  },
  labelActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    width: 24,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
