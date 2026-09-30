import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>EngUp</Text>
            <Text style={styles.brandSubtitle}>
              Học tiếng Anh thông minh, nhớ lâu hơn
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AppInput
              label="Email"
              placeholder="vidu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
            />

            <AppInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu của bạn"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
            />

            {error && <ErrorBanner message={error} />}

            <AppButton
              title="Đăng nhập"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  brandTitle: {
    ...Typography.headlineLg,
    fontSize: 38,
    lineHeight: 44,
    color: Colors.primaryContainer,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandSubtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    opacity: 0.8,
  },
  form: {
    gap: Spacing.md,
  },
  loginBtn: {
    marginTop: Spacing.xs,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  registerText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    opacity: 0.7,
  },
  registerLink: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  guestSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  guestLink: {
    ...Typography.labelMd,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
