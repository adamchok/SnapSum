import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { useTransactionsQuery } from '../../src/features/transactions/hooks';
import { formatMinorToCurrency } from '../../src/lib/money';

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactionsQuery = useTransactionsQuery();
  const transactions = transactionsQuery.data ?? [];

  return (
    <Screen title="Transactions" subtitle="All records from snap and manual entry">
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.ink500 }]}>
              No transactions yet. Snap a receipt or add one manually.
            </Text>
            <Pressable
              onPress={() => router.push('/transaction/new')}
              style={[styles.addButton, { backgroundColor: colors.brandPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Add your first transaction"
            >
              <Text style={styles.addLabel}>+ Add manually</Text>
            </Pressable>
          </View>
        }
        ListHeaderComponent={
          transactions.length > 0 ? (
            <Pressable
              onPress={() => router.push('/transaction/new')}
              style={[styles.headerAdd, { borderColor: colors.brandPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Add transaction manually"
            >
              <Text style={[styles.headerAddLabel, { color: colors.brandPrimary }]}>+ Add manually</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Link
            href={{ pathname: '/transaction/[id]', params: { id: item.id } }}
            asChild
          >
            <Pressable
              style={[styles.row, { borderBottomColor: colors.strokeSubtle }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.merchant}, ${formatMinorToCurrency(item.amountMinor, item.currency)}, ${item.category}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.merchant, { color: colors.ink900 }]}>{item.merchant}</Text>
                <Text style={[styles.meta, { color: colors.ink500 }]}>
                  {item.category} · {item.occurredOn}
                </Text>
              </View>
              <Text style={[styles.amount, { color: colors.ink900 }]}>
                {formatMinorToCurrency(item.amountMinor, item.currency)}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minHeight: 48,
    justifyContent: 'center',
  },
  addLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  headerAdd: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerAddLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
