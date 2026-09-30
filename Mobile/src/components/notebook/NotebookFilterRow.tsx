import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Spacing } from '../../constants/theme';
import { FilterChip } from '../common/FilterChip';

export interface NotebookFilterOption {
  id: string;
  label: string;
}

const FILTER_OPTIONS: NotebookFilterOption[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'reading', label: 'Đọc hiểu' },
  { id: 'listening', label: 'Nghe' },
  { id: 'vocabulary', label: 'Từ vựng' },
  { id: 'manual', label: 'Tự thêm' },
];

interface NotebookFilterRowProps {
  selectedFilter: string;
  onSelectFilter: (id: string) => void;
}

export const NotebookFilterRow: React.FC<NotebookFilterRowProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {FILTER_OPTIONS.map((opt) => (
        <FilterChip
          key={opt.id}
          label={opt.label}
          isActive={selectedFilter === opt.id}
          onPress={() => onSelectFilter(opt.id)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
