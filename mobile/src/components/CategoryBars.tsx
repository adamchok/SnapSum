import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, radius } from '../theme/tokens';
import { formatMinorToCurrency } from '../lib/money';

type CategoryBarItem = {
  category: string;
  totalMinor: number;
  color: string;
};

type CategoryBarsProps = {
  items: CategoryBarItem[];
  currency: string;
};

const CATEGORY_COLORS = [
  '#E67E22', '#27AE60', '#3498DB', '#9B59B6', '#E74C3C',
  '#1ABC9C', '#F39C12', '#2C3E50', '#8E44AD', '#7F8C8D',
];

export function assignCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function CategoryBars({ items, currency }: CategoryBarsProps) {
  const { colors } = useTheme();
  const max = Math.max(...items.map((i) => i.totalMinor), 1);

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const pct = Math.round((item.totalMinor / max) * 100);
        return (
          <View key={item.category} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={[styles.label, { color: colors.ink900 }]} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={[styles.amount, { color: colors.ink500 }]}>
                {formatMinorToCurrency(item.totalMinor, currency)}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.strokeSubtle }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct}%`, backgroundColor: item.color },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
