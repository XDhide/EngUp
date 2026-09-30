import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/design';

interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onChange, disabled = false }) => {
  const translateX = useRef(new Animated.Value(value ? 20 : 2)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 20 : 2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: value ? Colors.primaryContainer : Colors.surfaceContainerHighest },
        disabled && styles.disabled,
      ]}
      onPress={() => onChange(!value)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX }] },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
