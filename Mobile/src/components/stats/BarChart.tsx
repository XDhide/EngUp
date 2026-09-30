import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  unit: string;
  height?: number;
}

// Biểu đồ cột thuần View (không icon, không thư viện ngoài) theo design system.
export const BarChart: React.FC<BarChartProps> = ({ data, unit, height = 120 }) => {
  const max = Math.max(...data.map((d) => d.value), 0);
  const last = data.length - 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.axisRow}>
        <Text style={styles.axis}>{max > 0 ? `${max} ${unit}` : `0 ${unit}`}</Text>
      </View>
      <View style={[styles.plot, { height }]}>
        {data.map((d, i) => {
          const ratio = max > 0 ? d.value / max : 0;
          return (
            <View key={`${d.label}-${i}`} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(ratio * height, d.value > 0 ? 3 : 1) },
                  i === last && styles.barLatest,
                  d.value === 0 && styles.barEmpty,
                ]}
              />
            </View>
          );
        })}
      </View>
      {data.length > 0 && (
        <View style={styles.labelRow}>
          <Text style={styles.axis}>{data[0].label}</Text>
          <Text style={styles.axis}>{data[last].label}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  axisRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryContainer,
  },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.primaryFixedDim, borderTopLeftRadius: Rounded.sm, borderTopRightRadius: Rounded.sm },
  barLatest: { backgroundColor: Colors.primaryContainer },
  barEmpty: { backgroundColor: Colors.secondaryContainer },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axis: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
});
