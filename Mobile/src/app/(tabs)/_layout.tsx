import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Rounded } from '../../constants/theme';

// Thanh tab theo DESIGN.md: Trang chủ · Từ vựng · Luyện tập · Thống kê · Cá nhân.
// Sổ tay vẫn là một route của nhóm tab nhưng ẩn khỏi thanh (truy cập từ Từ vựng và Cá nhân).
const TAB_LABELS: Record<string, string> = {
  index: 'Trang chủ',
  vocabulary: 'Từ vựng',
  practice: 'Luyện tập',
  statistics: 'Thống kê',
  profile: 'Cá nhân',
};

// Tự vẽ thanh tab thay vì dùng item mặc định của react-navigation: mỗi tab là một ô rộng bằng nhau,
// nhãn căn giữa tuyệt đối trong ô nên không còn tab nào bị lệch (trước đây "Trang chủ" bị lệch trái).
function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  return (
    <View style={[styles.tabBar, { paddingBottom: bottomInset }]}>
      <View style={styles.row}>
        {state.routes.map((route: any, index: number) => {
          const label = TAB_LABELS[route.name];
          if (!label) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={styles.item}
            >
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                style={[styles.label, focused && styles.labelActive]}
              >
                {label}
              </Text>
              <View style={[styles.indicator, focused && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vocabulary" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="statistics" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="notebook" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 227, 246, 0.6)',
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
    color: 'rgba(18, 28, 42, 0.5)',
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: Rounded.full,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Colors.primaryContainer,
  },
});
