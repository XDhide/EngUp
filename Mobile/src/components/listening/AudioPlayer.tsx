import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

interface Props {
  audioUrl: string;
  onPlayStateChange?: (playing: boolean) => void;
}

export const AudioPlayer: React.FC<Props> = ({ audioUrl, onPlayStateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3); // mock

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    onPlayStateChange?.(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Pressable onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.playText}>{isPlaying ? 'TẠM DỪNG' : 'PHÁT'}</Text>
        </Pressable>
        <Text style={styles.speedText}>1x</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  playBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  playText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  speedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
