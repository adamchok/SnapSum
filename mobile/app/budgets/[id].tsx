import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { useBudgetDetailQuery, useEnvelopesQuery, useDeleteBudget } from '../../src/features/budgets/hooks';
import { useMonthlyCategorySpendQuery } from '../../src/features/transactions/hooks';
import { buildEnvelopeStatuses } from '../../src/features/budgets/engine';
import { formatMinorToCurrency } from '../../src/lib/money';

export default function BudgetDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const budgetId = params.id ?? '';
  const budgetQuery = useBudgetDetailQuery(budgetId);
  const envelopesQuery = useEnvelopesQuery(budgetId);
  const categorySpendQuery = useMonthlyCategorySpendQuery();
  const deleteMutation = useDeleteBudget();

  const budget = budgetQuery.data;
  const envelopes = envelopesQuery.data ?? [];
  const spendByCategory = new Map(
    (categorySpendQuery.data ?? []).map((r) => [r.category, r.totalMinor]),
  );
  const statuses = buildEnvelopeStatuses(envelopes, spendByCategory);
  const hasOverBudget = statuses.some((s) => s.isOver);
  const didHapticRef = useRef(false);

  useEffect(() => {
    if (hasOverBudget && !didHapticRef.current) {
      didHapticRef.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    if (!hasOverBudget) {
      didHapticRef.current = false;
    }
  }, [hasOverBudget]);

  const askDelete = () => {
    Alert.alert('Delete budget?', 'All envelopes will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(budgetId);
            router.back();
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Delete failed';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  if (budgetQuery.isLoading || !budget) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.surfaceBase }]}>
        <Text style={{ color: colors.ink500 }}>
          {budgetQuery.isLoading ? 'Loading...' : 'Budget not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surfaceBase }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.ink900 }]}>{budget.name}</Text>
      <Text style={[styles.meta, { color: colors.ink500 }]}>
        {budget.period} · {budget.currency}
      </Text>

      {statuses.map((status) => {
        const usage = Math.max(status.usagePct, 0);
        const isWarning = status.isWarning || status.isOver;

        return (
          <View
            key={status.envelope.id}
            style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          >
            <View style={styles.row}>
              <Text style={[styles.envName, { color: colors.ink900 }]}>
                {status.envelope.categoryName}
              </Text>
              <Text
                style={[
                  styles.pct,
                  { color: isWarning ? colors.stateWarning : colors.brandPrimaryDeep },
                ]}
              >
                {usage}%
              </Text>
            </View>
            <Text style={[styles.amounts, { color: colors.ink500 }]}>
              {formatMinorToCurrency(status.spentMinor, budget.currency)} /{' '}
              {formatMinorToCurrency(status.envelope.limitMinor, budget.currency)}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.strokeSubtle }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(usage, 100)}%`, backgroundColor: isWarning ? colors.stateWarning : colors.brandPrimary },
                ]}
              />
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={askDelete}
        style={[styles.deleteButton, { borderColor: colors.stateDanger }]}
        accessibilityRole="button"
        accessibilityLabel="Delete budget"
      >
        <Text style={{ color: colors.stateDanger, fontWeight: '600', fontSize: 15 }}>
          Delete budget
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envName: {
    fontSize: 16,
    fontWeight: '600',
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
  },
  amounts: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
  },
});
