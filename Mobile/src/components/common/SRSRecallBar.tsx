import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

interface SRSRecallBarProps {
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

export const SRSRecallBar: React.FC<SRSRecallBarProps> = ({ onRate }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.btnAgain]} onPress={() => onRate('again')}>
        <Text style={styles.textAgain}>Chưa nhớ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.btnHard]} onPress={() => onRate('hard')}>
        <Text style={styles.textHard}>Khó</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.btnGood]} onPress={() => onRate('good')}>
        <Text style={styles.textGood}>Tốt</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.btnEasy]} onPress={() => onRate('easy')}>
        <Text style={styles.textEasy}>Dễ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  btnAgain: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAgain: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  btnHard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textHard: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  btnGood: {
    backgroundColor: Colors.secondaryContainer,
  },
  textGood: {
    ...Typography.labelMd,
    color: Colors.onSecondaryFixed,
    fontWeight: '600',
  },
  btnEasy: {
    backgroundColor: Colors.primary,
  },
  textEasy: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '600',
  },
});
