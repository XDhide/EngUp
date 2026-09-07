import { useRouter } from 'expo-router';
import { SymbolView, SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

// Dữ liệu thống kê mẫu
const STATS = {
  totalWords: 12,
  learnedWords: 7,
  practiceSessions: 5,
  correctRate: 83,
};

type MenuCardProps = {
  symbol: SFSymbol;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
};

function MenuCard({ symbol, title, description, onPress, disabled }: MenuCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuCard,
        {
          backgroundColor: colors.backgroundElement,
          opacity: pressed ? 0.75 : disabled ? 0.45 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.menuCardIcon, { backgroundColor: colors.backgroundSelected }]}>
        <SymbolView
          name={symbol}
          tintColor={colors.text}
          size={22}
        />
      </View>
      <View style={styles.menuCardContent}>
        <ThemedText type="smallBold" style={styles.menuCardTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      {!disabled && (
        <SymbolView
          name="chevron.right"
          tintColor={colors.textSecondary}
          size={14}
        />
      )}
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

          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Xin chào</ThemedText>
              <ThemedText style={styles.userName}>Học viên</ThemedText>
            </View>
            <Pressable
              style={[styles.logoutBtn, { backgroundColor: colors.backgroundElement }]}
              onPress={() => router.replace('/login')}
            >
              <ThemedText type="small" themeColor="textSecondary">Đăng xuất</ThemedText>
            </Pressable>
          </View>

          {/* Thống kê */}
          <ThemedView type="backgroundElement" style={styles.statsCard}>
            <View style={styles.statsTitleRow}>
              <SymbolView
                name="chart.bar.fill"
                tintColor={colors.text}
                size={18}
              />
              <ThemedText type="smallBold" style={styles.statsTitleText}>
                Thống kê học tập
              </ThemedText>
            </View>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText type="small" themeColor="textSecondary">Tiến độ tổng thể</ThemedText>
                <ThemedText type="smallBold">{progressPercent}%</ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSelected }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: colors.text },
                  ]}
                />
              </View>
            </View>

            {/* Stat boxes */}
            <View style={styles.statBoxes}>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.statNumber}>{STATS.learnedWords}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>Đã học</ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.statNumber}>{STATS.totalWords}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>Tổng từ</ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.statNumber}>{STATS.correctRate}%</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>Đúng</ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.statNumber}>{STATS.practiceSessions}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>Lần ôn</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Chức năng */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
            CHỨC NĂNG
          </ThemedText>

          <View style={styles.menuList}>
            <MenuCard
              symbol="book.fill"
              title="Danh sách từ vựng"
              description="Xem và tìm kiếm toàn bộ từ vựng"
              onPress={() => router.push('/vocabulary')}
            />
            <MenuCard
              symbol="checkmark.circle.fill"
              title="Ôn tập từ vựng"
              description="Kiểm tra kiến thức với câu hỏi trắc nghiệm"
              onPress={() => router.push('/practice')}
            />
            <MenuCard
              symbol="star.fill"
              title="Từ yêu thích"
              description="Ôn lại những từ đã đánh dấu"
              onPress={() => {}}
              disabled
            />
            <MenuCard
              symbol="clock.fill"
              title="Lịch sử học tập"
              description="Xem lại kết quả các buổi học trước"
              onPress={() => {}}
              disabled
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  statsCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statsTitleText: {
    fontSize: 15,
  },
  progressSection: { gap: Spacing.one },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: Spacing.one,
  },
  menuList: { gap: Spacing.two },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  menuCardIcon: {
    width: 46,
    height: 46,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardContent: {
    flex: 1,
    gap: 2,
  },
  menuCardTitle: { fontSize: 15 },
});
