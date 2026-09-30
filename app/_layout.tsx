import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/design';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.surface }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Screens */}
        <Stack.Screen name="listening-list" />
        <Stack.Screen name="listening-detail" />
        <Stack.Screen name="reading-list" />
        <Stack.Screen name="reading-detail" />
        <Stack.Screen name="writing" />
        <Stack.Screen name="test-list" />
        <Stack.Screen name="exam-room" />
        <Stack.Screen name="test-result" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="notification-settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
