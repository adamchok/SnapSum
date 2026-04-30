import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';

type SparklineProps = {
  data: number[];
  height?: number;
};

export function Sparkline({ data, height = 40 }: SparklineProps) {
  const { colors } = useTheme();

  if (data.length < 2) return null;

  const max = Math.max(...data, 1);

  return (
    <View style={[styles.container, { height }]} accessibilityLabel="Spending trend chart">
      {data.map((value, idx) => {
        const barHeight = Math.max((value / max) * height, 2);
        return (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: colors.brandPrimary,
                opacity: 0.4 + (value / max) * 0.6,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: radius.sm / 2,
    minWidth: 3,
  },
});
