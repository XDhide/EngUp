import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { Colors } from '@/constants/design';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }}>
          {/* Auth */}
          <Stack.Screen name="login" />
          {/* Main tabs */}
          <Stack.Screen name="(tabs)" />
          {/* Detail screens (stack) */}
          <Stack.Screen name="(screens)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
