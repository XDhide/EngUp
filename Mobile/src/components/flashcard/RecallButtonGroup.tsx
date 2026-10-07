import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Rounded } from '../../constants/theme';
import { ReviewResultType } from '../../services/reviewService';

interface RecallButtonGroupProps {
  onSelect: (result: ReviewResultType) => void;
  disabled?: boolean;
}

export const RecallButtonGroup: React.FC<RecallButtonGroupProps> = ({
  onSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Chưa nhớ (Again) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnOutline]}
        onPress={() => onSelect('again')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, styles.textDark]}>Chưa nhớ</Text>
      </TouchableOpacity>

      {/* 2. Khó (Hard) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnOutline]}
        onPress={() => onSelect('hard')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, styles.textDark]}>Khó</Text>
      </TouchableOpacity>

      {/* 3. Tốt (Good) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnGood]}
        onPress={() => onSelect('good')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, styles.textGood]}>Tốt</Text>
      </TouchableOpacity>

      {/* 4. Dễ (Easy) */}
      <TouchableOpacity
        style={[styles.btn, styles.btnEasy]}
        onPress={() => onSelect('easy')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, styles.textEasy]}>Dễ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 54,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  btnOutline: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.secondaryFixed,
  },
  btnGood: {
    backgroundColor: Colors.secondaryContainer,
  },
  btnEasy: {
    backgroundColor: Colors.primaryContainer,
  },
  btnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
  },
  subtext: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.outline,
    marginTop: 1,
  },
  textDark: {
    color: Colors.onSurface,
  },
  textGood: {
    color: Colors.onSecondaryContainer,
  },
  textEasy: {
    color: Colors.onPrimary,
  },
});
