import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ProgressBar } from './ProgressBar';

interface AudioPlayerProps {
  uri: string | null;
  /** Cho phép chọn tốc độ 0.75x / 1x / 1.25x (mặc định bật) */
  showSpeed?: boolean;
}

const SPEEDS = [0.75, 1, 1.25];
const LOAD_TIMEOUT_MS = 10000;

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Trình phát chỉ dùng chữ (không icon) theo design system của EngUp.
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, showSpeed = true }) => {
  const player = useAudioPlayer(uri ? { uri } : undefined);
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = useState(1);
  const [timedOut, setTimedOut] = useState(false);

  // expo-audio không báo lỗi tải riêng; quá thời gian mà chưa loaded thì coi như lỗi nguồn audio.
  useEffect(() => {
    setTimedOut(false);
    if (!uri) return;
    const t = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [uri]);

  useEffect(() => {
    if (status.isLoaded) setTimedOut(false);
  }, [status.isLoaded]);

  if (!uri) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Bài này chưa có file audio.</Text>
      </View>
    );
  }

  const failed = timedOut && !status.isLoaded;
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const replay = async () => {
    await player.seekTo(0);
    player.play();
  };

  const changeRate = (r: number) => {
    setRate(r);
    player.setPlaybackRate(r);
  };

  return (
    <View style={styles.card}>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{fmt(status.currentTime)}</Text>
        <Text style={styles.time}>{status.isLoaded ? fmt(status.duration) : '--:--'}</Text>
      </View>
      <ProgressBar progress={progress} height={6} />

      {failed ? (
        <Text style={styles.errorText}>
          Không tải được audio. Kiểm tra kết nối mạng hoặc đường dẫn file audio của bài.
        </Text>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.playBtn, !status.isLoaded && styles.disabled]}
            onPress={togglePlay}
            disabled={!status.isLoaded}
            activeOpacity={0.85}
          >
            <Text style={styles.playText}>
              {!status.isLoaded ? 'Đang tải...' : status.playing ? 'Tạm dừng' : 'Phát'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostBtn, !status.isLoaded && styles.disabled]}
            onPress={replay}
            disabled={!status.isLoaded}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostText}>Nghe lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {showSpeed && (
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>TỐC ĐỘ</Text>
          {SPEEDS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => changeRate(r)}
              style={[styles.speedChip, rate === r && styles.speedChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.speedText, rate === r && styles.speedTextActive]}>{r}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  controls: { flexDirection: 'row', gap: Spacing.sm },
  playBtn: {
    flex: 1,
    height: 46,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: { ...Typography.labelMd, color: Colors.onPrimaryContainer, fontWeight: '700' },
  ghostBtn: {
    height: 46,
    paddingHorizontal: Spacing.lg,
    borderRadius: Rounded.md,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { ...Typography.labelMd, color: Colors.onSecondaryContainer, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  speedLabel: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', marginRight: 4 },
  speedChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Rounded.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  speedChipActive: { backgroundColor: Colors.primaryContainer },
  speedText: { ...Typography.labelSm, color: Colors.onSurfaceVariant, fontWeight: '600' },
  speedTextActive: { color: Colors.onPrimaryContainer, fontWeight: '700' },
  errorText: { ...Typography.bodyMd, color: Colors.error },
});
