import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, hint }) => (
  <View style={styles.tile}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {!!hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  label: { ...Typography.labelSm, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  value: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  hint: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
});
