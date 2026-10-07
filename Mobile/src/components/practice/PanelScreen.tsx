import React, { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';
import { AppHeader } from '../common/AppHeader';

interface PanelScreenProps {
  title: string;
  /** Render một panel của tab Luyện tập dưới dạng màn hình đầy đủ (có nút quay lại, kéo để làm mới). */
  children: (props: { refreshKey: number; onLoaded: () => void }) => React.ReactNode;
}

export const PanelScreen: React.FC<PanelScreenProps> = ({ title, children }) => {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const onLoaded = useCallback(() => setRefreshing(false), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={title} showBack onBack={() => router.back()} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setRefreshKey((k) => k + 1);
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {children({ refreshKey, onLoaded })}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  bottomSpacer: { height: Spacing.xl },
});
