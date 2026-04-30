import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

type EmptyStateProps = {
  message: string;
  hint?: string;
};

export function EmptyState({ message, hint }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.shape, { borderColor: colors.brandPrimary }]} />
      <Text style={[styles.message, { color: colors.ink700 }]}>{message}</Text>
      {hint && <Text style={[styles.hint, { color: colors.ink500 }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  shape: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
});
