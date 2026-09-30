import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors, Typography } from '@/constants/design';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surfaceContainerLowest,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          ...Typography.labelSm,
          marginTop: 2,
        },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="vocabulary" options={{ title: 'Từ vựng' }} />
      <Tabs.Screen name="practice" options={{ title: 'Luyện tập' }} />
      <Tabs.Screen name="stats" options={{ title: 'Thống kê' }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân' }} />
    </Tabs>
  );
}
