import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Đưa người dùng về màn đăng nhập khi chưa có phiên (hoặc phiên vừa hết hạn).
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const first = segments[0] as string | undefined;
    const inAuthScreens = first === 'login' || first === 'register';
    if (!isAuthenticated && !inAuthScreens) router.replace('/login');
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="placement-test" />
          <Stack.Screen name="daily-words" />
          <Stack.Screen name="flashcard" />
          <Stack.Screen name="review-summary" />
          <Stack.Screen name="topic-detail" />
          <Stack.Screen name="reading-detail" />
          <Stack.Screen name="listening-lesson" />
          <Stack.Screen name="writing-editor" />
          <Stack.Screen name="test-session" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="reading-list" />
          <Stack.Screen name="listening-list" />
          <Stack.Screen name="writing-list" />
          <Stack.Screen name="test-list" />
          <Stack.Screen name="test-result" />
          <Stack.Screen name="notification-settings" />
          <Stack.Screen name="notes" />
          <Stack.Screen name="contribute" />
          <Stack.Screen name="learning-paths" />
          <Stack.Screen name="learning-path-detail" />
          <Stack.Screen name="learning-path-create" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
