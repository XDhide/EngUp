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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      // Navigate to placement test or home
      router.replace('/placement-test');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backBtn}>Quay lại</Text>
            </TouchableOpacity>
            <Text style={styles.brandTitle}>EngUp</Text>
          </View>

          {/* Banner & Title */}
          <View style={styles.bannerSection}>
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>Phương pháp ngắt quãng SRS</Text>
            </View>
            <Text style={styles.screenTitle}>Tạo tài khoản</Text>
            <Text style={styles.screenSubtitle}>
              Bắt đầu hành trình ghi nhớ từ vựng dễ dàng cùng EngUp
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AppInput
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setError(null);
              }}
            />

            <AppInput
              label="Email"
              placeholder="vidu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
            />

            <View>
              <AppInput
                label="Mật khẩu"
                placeholder="••••••••"
                isPassword
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError(null);
                }}
              />
              <Text style={styles.passwordHint}>
                Mật khẩu tối thiểu 8 ký tự
              </Text>
            </View>

            {error && <ErrorBanner message={error} />}

            <Text style={styles.termsText}>
              Bằng việc bấm Đăng ký, bạn đồng ý với{' '}
              <Text style={styles.linkText}>Điều khoản</Text> và{' '}
              <Text style={styles.linkText}>Chính sách bảo mật</Text> của EngUp.
            </Text>

            <AppButton
              title="Đăng ký"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerBtn}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
    paddingHorizontal: Spacing.margin,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  backBtn: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  brandTitle: {
    ...Typography.headlineMd,
    color: Colors.primaryContainer,
    fontWeight: '800',
  },
  bannerSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  methodBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rounded.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  methodText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  screenTitle: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
  },
  screenSubtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  form: {
    gap: Spacing.md,
  },
  passwordHint: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  termsText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  registerBtn: {
    marginTop: Spacing.xs,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  loginPromptText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    opacity: 0.7,
  },
  loginLink: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
});
