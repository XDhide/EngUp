import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Assuming BottomNav exists at @/components/common/BottomNav
// If it doesn't, we can define a simple custom tab bar here or rely on the default with hidden styles.
import { BottomNav } from '@/components/common/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vocabulary" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
