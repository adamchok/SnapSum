import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  scrollable?: boolean;
}>;

export function Screen({ title, subtitle, children, scrollable = false }: ScreenProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink900 }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.ink500 }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </>
  );

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
});
