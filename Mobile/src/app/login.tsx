import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  const handleLogin = () => {
    // TODO: thêm xác thực thật ở đây
    router.replace('/menu');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <ThemedText style={styles.logoText}>E</ThemedText>
            </View>
            <ThemedText type="title" style={styles.appName}>
              EnglishLab
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Học tiếng Anh mỗi ngày
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>
                Email
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: emailFocused ? '#4A90D9' : 'transparent',
                  },
                ]}
                placeholder="Nhập email của bạn"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>
                Mật khẩu
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: passwordFocused ? '#4A90D9' : 'transparent',
                  },
                ]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
              />
            </View>

            <Pressable style={styles.forgotPassword}>
              <ThemedText type="small" style={styles.linkText}>
                Quên mật khẩu?
              </ThemedText>
            </Pressable>

            {/* Nút Đăng nhập */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleLogin}
            >
              <ThemedText style={styles.loginButtonText}>Đăng nhập</ThemedText>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.backgroundElement }]} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.dividerText}>
                hoặc
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: colors.backgroundElement }]} />
            </View>

            {/* Đăng ký */}
            <View style={styles.registerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Chưa có tài khoản?{' '}
              </ThemedText>
              <Pressable>
                <ThemedText type="small" style={styles.linkText}>
                  Đăng ký ngay
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    marginBottom: 2,
  },
  input: {
    height: 52,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    borderWidth: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  linkText: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#4A90D9',
    height: 52,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.one,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
