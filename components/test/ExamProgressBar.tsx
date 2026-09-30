import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/design';

interface Props {
  current: number;
  total: number;
  answered: number[]; // Array of answered indices (0-based)
  timeLeft: string;
}

export default function ExamProgressBar({ current, total, answered, timeLeft }: Props) {
  const progressPercent = (answered.length / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>
        <Text style={styles.progressText}>{answered.length}/{total}</Text>
      </View>
      
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isCurrent = idx === current;
          const isAnswered = answered.includes(idx);
          
          let bgColor = '#F3F4F6'; // surfaceContainerHigh approx
          let textColor = Colors.onSurfaceVariant;
          
          if (isCurrent) {
            bgColor = Colors.primary;
            textColor = '#FFFFFF';
          } else if (isAnswered) {
            bgColor = Colors.secondaryContainer;
            textColor = Colors.onSecondaryFixed;
          }

          return (
            <View key={idx} style={[styles.questionBox, { backgroundColor: bgColor }]}>
              <Text style={[styles.questionNumber, { color: textColor }]}>{idx + 1}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  timerPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timerText: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.onSecondaryFixed,
    fontSize: 14,
  },
  progressText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  track: {
    height: 6,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    borderRadius: 3,
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  questionBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
  }
});
