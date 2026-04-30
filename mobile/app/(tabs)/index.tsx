import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { SnapFab } from '../../src/components/SnapFab';
import { Sparkline } from '../../src/components/Sparkline';
import { CategoryBars, assignCategoryColor } from '../../src/components/CategoryBars';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import {
  useMonthlySpendQuery,
  useTransactionsQuery,
  useMonthlyCategorySpendQuery,
  useDailySpendQuery,
} from '../../src/features/transactions/hooks';
import { formatMinorToCurrency } from '../../src/lib/money';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactionsQuery = useTransactionsQuery();
  const monthlySpendQuery = useMonthlySpendQuery();
  const categorySpendQuery = useMonthlyCategorySpendQuery();
  const dailySpendQuery = useDailySpendQuery();

  const monthlySpend = monthlySpendQuery.data ?? 0;
  const recent = (transactionsQuery.data ?? []).slice(0, 5);
  const categoryData = (categorySpendQuery.data ?? [])
    .sort((a, b) => b.totalMinor - a.totalMinor)
    .slice(0, 5)
    .map((item, idx) => ({
      category: item.category,
      totalMinor: item.totalMinor,
      color: assignCategoryColor(idx),
    }));

  const dailyData = (dailySpendQuery.data ?? []).map((d) => d.totalMinor);

  const monthLabel = new Date().toLocaleDateString('en-MY', {
    month: 'long',
    year: 'numeric',
  });

  const hasData = recent.length > 0;

  return (
    <Screen title={getGreeting()} subtitle={monthLabel}>
      {!hasData ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            message="No transactions yet"
            hint="Snap a receipt or add a transaction manually to get started."
          />
          <View style={styles.emptyActions}>
            <SnapFab onPress={() => router.push('/capture')} />
            <Pressable
              onPress={() => router.push('/transaction/new')}
              style={[styles.manualButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
              accessibilityRole="button"
              accessibilityLabel="Add transaction manually"
            >
              <Text style={[styles.manualLabel, { color: colors.ink700 }]}>Add manually</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.balanceCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.strokeSubtle }]}>
            <Text style={[styles.balanceLabel, { color: colors.ink500 }]}>This month</Text>
            <Text style={[styles.balanceValue, { color: colors.ink900 }]}>
              {formatMinorToCurrency(monthlySpend, 'MYR')}
            </Text>
            {dailyData.length > 1 && (
              <View style={styles.sparklineWrap}>
                <Sparkline data={dailyData} height={36} />
              </View>
            )}
          </View>

          {categoryData.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink700 }]}>By category</Text>
              <CategoryBars items={categoryData} currency="MYR" />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.ink700 }]}>Recent</Text>
            {recent.map((item) => (
              <Link
                href={{ pathname: '/transaction/[id]', params: { id: item.id } }}
                asChild
                key={item.id}
              >
                <Pressable
                  style={[styles.row, { borderBottomColor: colors.strokeSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.merchant}, ${formatMinorToCurrency(item.amountMinor, item.currency)}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.ink900 }]}>{item.merchant}</Text>
                    <Text style={[styles.rowMeta, { color: colors.ink500 }]}>
                      {item.category} · {formatDateLabel(item.occurredOn)}
                    </Text>
                  </View>
                  <Text style={[styles.rowAmount, { color: colors.ink900 }]}>
                    {formatMinorToCurrency(item.amountMinor, item.currency)}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>

          <View style={styles.fabRow}>
            <Pressable
              onPress={() => router.push('/transaction/new')}
              style={[styles.manualButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
              accessibilityRole="button"
              accessibilityLabel="Add transaction manually"
            >
              <Text style={[styles.manualLabel, { color: colors.ink700 }]}>+ Manual</Text>
            </Pressable>
            <SnapFab onPress={() => router.push('/capture')} />
          </View>
        </>
      )}
    </Screen>
  );
}

function formatDateLabel(occurredOn: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (occurredOn === today) return 'Today';
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (occurredOn === yesterday) return 'Yesterday';
  return occurredOn;
}

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 13,
  },
  balanceValue: {
    marginTop: spacing.sm,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  sparklineWrap: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 13,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fabRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  manualButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  manualLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
