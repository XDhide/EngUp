import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

interface Props {
  onSubmit: (text: string) => void;
  wordCount: number;
  loading?: boolean;
}

export const DictationInput: React.FC<Props> = ({ onSubmit, wordCount, loading }) => {
  const [text, setText] = useState('');

  const currentWords = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Nhập nội dung bạn nghe được..."
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
        editable={!loading}
      />
      
      <View style={styles.footer}>
        <Text style={styles.wordCount}>{currentWords} / {wordCount} từ</Text>
      </View>

      <View style={styles.actions}>
        <Pressable 
          style={styles.clearBtn} 
          onPress={() => setText('')}
          disabled={loading}
        >
          <Text style={styles.clearText}>Xóa làm lại</Text>
        </Pressable>

        <Pressable 
          style={[styles.submitBtn, (!text.trim() || loading) && styles.submitBtnDisabled]} 
          onPress={() => onSubmit(text)}
          disabled={!text.trim() || loading}
        >
          <Text style={styles.submitText}>{loading ? 'Đang kiểm tra...' : 'Kiểm tra đáp án'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    minHeight: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  wordCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  clearText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
