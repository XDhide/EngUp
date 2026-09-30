import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface NotebookSearchHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
}

export const NotebookSearchHeader: React.FC<NotebookSearchHeaderProps> = ({
  totalCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
}) => {
  return (
    <View style={styles.container}>
      {/* Title & Badge */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Sổ tay của tôi</Text>
          <Text style={styles.subtitle}>Phân loại theo ngữ cảnh học chủ động</Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>{totalCount} từ đã lưu</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Tìm từ, nghĩa tiếng Việt, ghi chú..."
          placeholderTextColor={Colors.outline}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
            <Text style={styles.clearText}>Xoá</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  counterBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rounded.full,
  },
  counterText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  searchBar: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    height: '100%',
  },
  clearBtn: {
    paddingLeft: Spacing.sm,
  },
  clearText: {
    ...Typography.labelSm,
    color: Colors.tertiary,
    fontWeight: '600',
  },
});
