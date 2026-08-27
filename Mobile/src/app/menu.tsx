import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

// Dữ liệu thống kê mẫu — sau này lấy từ context/store thật
const STATS = {
  totalWords: 12,
  learnedWords: 7,
  practiceSessions: 5,
  correctRate: 83,
};

type MenuCardProps = {
  emoji: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
};

function MenuCard({ emoji, title, description, color, onPress }: MenuCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuCard,
        { backgroundColor: colors.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuCardIcon, { backgroundColor: color + '22' }]}>
        <ThemedText style={styles.menuCardEmoji}>{emoji}</ThemedText>
      </View>
      <View style={styles.menuCardContent}>
        <ThemedText type="smallBold" style={styles.menuCardTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <ThemedText style={[styles.menuCardArrow, { color }]}>›</ThemedText>
    </Pressable>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  const progressPercent = Math.round((STATS.learnedWords / STATS.totalWords) * 100);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Xin chào 👋
              </ThemedText>
              <ThemedText type="subtitle" style={styles.userName}>
                Học viên
              </ThemedText>
            </View>
            <Pressable
              style={[styles.logoutBtn, { backgroundColor: colors.backgroundElement }]}
              onPress={() => router.replace('/login')}
            >
              <ThemedText type="small" themeColor="textSecondary">
                Đăng xuất
              </ThemedText>
            </Pressable>
          </View>

          {/* ── Thống kê tổng quan ── */}
          <ThemedView type="backgroundElement" style={styles.statsCard}>
            <ThemedText type="smallBold" style={styles.statsTitle}>
              📊 Thống kê học tập
            </ThemedText>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText type="small" themeColor="textSecondary">
                  Tiến độ tổng thể
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: '#4A90D9' }}>
                  {progressPercent}%
                </ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSelected }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: '#4A90D9' },
                  ]}
                />
              </View>
            </View>

            {/* Stat boxes */}
            <View style={styles.statBoxes}>
              <View style={[styles.statBox, { backgroundColor: '#4A90D9' + '22' }]}>
                <ThemedText style={[styles.statNumber, { color: '#4A90D9' }]}>
                  {STATS.learnedWords}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Đã học
                </ThemedText>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#34C759' + '22' }]}>
                <ThemedText style={[styles.statNumber, { color: '#34C759' }]}>
                  {STATS.totalWords}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Tổng từ
                </ThemedText>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FF9500' + '22' }]}>
                <ThemedText style={[styles.statNumber, { color: '#FF9500' }]}>
                  {STATS.correctRate}%
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Đúng
                </ThemedText>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#AF52DE' + '22' }]}>
                <ThemedText style={[styles.statNumber, { color: '#AF52DE' }]}>
                  {STATS.practiceSessions}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Lần ôn
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* ── Chức năng ── */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Chức năng
          </ThemedText>

          <View style={styles.menuList}>
            <MenuCard
              emoji="📚"
              title="Danh sách từ vựng"
              description="Xem và tìm kiếm toàn bộ từ vựng"
              color="#4A90D9"
              onPress={() => router.push('/vocabulary')}
            />
            <MenuCard
              emoji="🎯"
              title="Ôn tập từ vựng"
              description="Kiểm tra kiến thức với câu hỏi trắc nghiệm"
              color="#34C759"
              onPress={() => router.push('/practice')}
            />
            <MenuCard
              emoji="⭐"
              title="Từ yêu thích"
              description="Ôn lại những từ đã đánh dấu"
              color="#FF9500"
              onPress={() => {}}
            />
            <MenuCard
              emoji="📈"
              title="Lịch sử học tập"
              description="Xem lại kết quả các buổi học trước"
              color="#AF52DE"
              onPress={() => {}}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Spacing.five,
  },

  // Stats card
  statsCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  statsTitle: {
    fontSize: 16,
  },
  progressSection: {
    gap: Spacing.one,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statBoxes: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statBox: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.one,
  },
  menuList: {
    gap: Spacing.two,
  },

  // Menu card
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  menuCardIcon: {
    width: 52,
    height: 52,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardEmoji: {
    fontSize: 26,
  },
  menuCardContent: {
    flex: 1,
    gap: 2,
  },
  menuCardTitle: {
    fontSize: 16,
  },
  menuCardArrow: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
  },
});

