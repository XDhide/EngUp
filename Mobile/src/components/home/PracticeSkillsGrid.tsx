import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface SkillItem {
  tag: string;
  title: string;
  subtitle: string;
  route: string;
}

const SKILLS: SkillItem[] = [
  {
    tag: 'Kỹ năng',
    title: 'Đọc hiểu',
    subtitle: 'Bài báo & hội thoại ngắn',
    route: '/(tabs)/practice?tab=reading',
  },
  {
    tag: 'Kỹ năng',
    title: 'Nghe chép',
    subtitle: 'Luyện phản xạ chính tả',
    route: '/(tabs)/practice?tab=listening',
  },
  {
    tag: 'Ứng dụng',
    title: 'Viết',
    subtitle: 'Áp dụng từ theo ngữ cảnh',
    route: '/(tabs)/practice?tab=writing',
  },
  {
    tag: 'Đánh giá',
    title: 'Luyện đề',
    subtitle: 'Flashcard & trắc nghiệm',
    route: '/(tabs)/practice?tab=test',
  },
];

export const PracticeSkillsGrid: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tiếp tục luyện tập</Text>
      <View style={styles.grid}>
        {SKILLS.map((skill, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => router.push(skill.route as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.tag}>{skill.tag}</Text>
            <View style={styles.textGroup}>
              <Text style={styles.title}>{skill.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {skill.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    minHeight: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.4)',
  },
  tag: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textGroup: {
    marginTop: Spacing.sm,
  },
  title: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
});
