import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { register as apiRegister } from '@/services/auth.service';
import { setTokens } from '@/services/api';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Đăng nhập thất bại', e.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister({ name: name.trim(), email: email.trim(), password });
      await setTokens(data.accessToken, data.refreshToken);
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Đăng ký thất bại', e.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitials}>EU</Text>
            </View>
            <Text style={styles.appName}>EngUp</Text>
            <Text style={styles.tagline}>Học tiếng Anh mỗi ngày — nhẹ nhàng, bền vững</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                  {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {tab === 'register' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={tab === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnLabel}>
                  {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>EngUp v1.0 — Bản thử nghiệm</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  logoSection: { alignItems: 'center', gap: Spacing.sm },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: { ...Typography.headlineMd, color: Colors.primary },
  appName: { ...Typography.headlineLg, color: Colors.onSurface },
  tagline: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabBtnActive: { backgroundColor: Colors.surfaceContainerLowest },
  tabLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  tabLabelActive: { color: Colors.primary },

  form: { gap: Spacing.md },
  field: { gap: Spacing.xs },
  fieldLabel: { ...Typography.labelMd, color: Colors.onSurface },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },

  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnLabel: { ...Typography.labelMd, color: Colors.onPrimary, fontSize: 16 },

  footer: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
