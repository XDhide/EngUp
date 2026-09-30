import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Rounded } from '../../constants/theme';

const tabOptions = (label: string) => ({
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <View style={styles.tabItem}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.indicator} />}
    </View>
  ),
});

// Thanh tab theo DESIGN.md: Trang chủ · Từ vựng · Luyện tập · Thống kê · Cá nhân.
// Sổ tay vẫn là một route của nhóm tab nhưng ẩn khỏi thanh (truy cập từ Từ vựng và Cá nhân).
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={tabOptions('Trang chủ')} />
      <Tabs.Screen name="vocabulary" options={tabOptions('Từ vựng')} />
      <Tabs.Screen name="practice" options={tabOptions('Luyện tập')} />
      <Tabs.Screen name="statistics" options={tabOptions('Thống kê')} />
      <Tabs.Screen name="profile" options={tabOptions('Cá nhân')} />
      <Tabs.Screen name="notebook" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 227, 246, 0.6)',
    paddingBottom: 6,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    minWidth: 64,
  },
  tabLabel: {
    ...Typography.labelSm,
    fontSize: 12,
    color: 'rgba(18, 28, 42, 0.5)',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 2.5,
    borderRadius: Rounded.full,
    backgroundColor: Colors.primaryContainer,
  },
});
