import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

type ConfidenceBadgeProps = {
  value: number;
};

export function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const { colors } = useTheme();
  const pct = Math.round(value * 100);

  let label: string;
  let dotColor: string;

  if (value >= 0.8) {
    label = 'High';
    dotColor = colors.stateSuccess;
  } else if (value >= 0.5) {
    label = 'Medium';
    dotColor = colors.stateWarning;
  } else {
    label = 'Low';
    dotColor = colors.stateDanger;
  }

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Confidence: ${label}, ${pct}%`}
      accessibilityRole="text"
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: colors.ink500 }]}>
        {pct}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
