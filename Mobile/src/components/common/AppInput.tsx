import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Rounded, Spacing } from '../../constants/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  isPassword = false,
  rightActionLabel,
  onRightActionPress,
  secureTextEntry,
  style,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {(label || rightActionLabel) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightActionLabel && onRightActionPress && (
            <TouchableOpacity onPress={onRightActionPress} activeOpacity={0.7}>
              <Text style={styles.rightActionText}>{rightActionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.outline}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  rightActionText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  inputContainer: {
    height: 50,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.primaryContainer,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  toggleBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: 8,
  },
  toggleText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: Colors.errorContainer,
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.labelSm,
    color: Colors.onErrorContainer,
  },
});
