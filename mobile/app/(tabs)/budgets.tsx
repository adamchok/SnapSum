import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { useBudgetsQuery, useEnvelopesQuery } from '../../src/features/budgets/hooks';
import { useMonthlyCategorySpendQuery } from '../../src/features/transactions/hooks';
import { buildEnvelopeStatuses } from '../../src/features/budgets/engine';
import { formatMinorToCurrency } from '../../src/lib/money';

export default function BudgetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const budgetsQuery = useBudgetsQuery();
  const budgets = budgetsQuery.data ?? [];
  const firstBudget = budgets[0];

  const monthLabel = new Date().toLocaleDateString('en-MY', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Screen title="Budgets" subtitle={`Monthly envelopes · ${monthLabel}`}>
      {budgets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.ink500 }]}>
            No budgets yet. Create one to start tracking your spending.
          </Text>
          <Pressable
            onPress={() => router.push('/budgets/new' as any)}
            style={[styles.createButton, { backgroundColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Create your first budget"
          >
            <Text style={styles.createLabel}>Create budget</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {budgets.map((budget) => (
            <Link
              key={budget.id}
              href={{ pathname: '/budgets/[id]' as any, params: { id: budget.id } }}
              asChild
            >
              <Pressable
                style={[styles.budgetCard, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
                accessibilityRole="button"
                accessibilityLabel={`View ${budget.name}`}
              >
                <Text style={[styles.budgetName, { color: colors.ink900 }]}>{budget.name}</Text>
                <Text style={[styles.budgetMeta, { color: colors.ink500 }]}>
                  {budget.period} · {budget.currency}
                </Text>
              </Pressable>
            </Link>
          ))}

          {firstBudget && (
            <BudgetEnvelopeList budgetId={firstBudget.id} currency={firstBudget.currency} />
          )}

          <Pressable
            onPress={() => router.push('/budgets/new' as any)}
            style={[styles.addButton, { borderColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Create another budget"
          >
            <Text style={[styles.addLabel, { color: colors.brandPrimary }]}>+ New budget</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

function BudgetEnvelopeList({ budgetId, currency }: { budgetId: string; currency: string }) {
  const { colors } = useTheme();
  const envelopesQuery = useEnvelopesQuery(budgetId);
  const categorySpendQuery = useMonthlyCategorySpendQuery();
  const envelopes = envelopesQuery.data ?? [];
  const spendByCategory = new Map(
    (categorySpendQuery.data ?? []).map((r) => [r.category, r.totalMinor]),
  );
  const statuses = buildEnvelopeStatuses(envelopes, spendByCategory);

  if (envelopes.length === 0) return null;

  return (
    <>
      {statuses.map((status) => {
        const usage = Math.max(status.usagePct, 0);
        const isWarning = status.isWarning || status.isOver;

        return (
          <View
            key={status.envelope.id}
            style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          >
            <View style={styles.row}>
              <Text style={[styles.name, { color: colors.ink900 }]}>
                {status.envelope.categoryName}
              </Text>
              <Text
                style={[
                  styles.percent,
                  { color: isWarning ? colors.stateWarning : colors.brandPrimaryDeep },
                ]}
              >
                {usage}%
              </Text>
            </View>
            <Text style={[styles.amount, { color: colors.ink500 }]}>
              {formatMinorToCurrency(status.spentMinor, currency)} /{' '}
              {formatMinorToCurrency(status.envelope.limitMinor, currency)}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.strokeSubtle }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(usage, 100)}%`,
                    backgroundColor: isWarning ? colors.stateWarning : colors.brandPrimary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  createButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minHeight: 48,
    justifyContent: 'center',
  },
  createLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  budgetCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: '700',
  },
  budgetMeta: {
    fontSize: 13,
  },
  addButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
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
});
