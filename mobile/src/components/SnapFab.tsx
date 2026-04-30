import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type SnapFabProps = {
  onPress: () => void;
  style?: ViewStyle;
};

export function SnapFab({ onPress, style }: SnapFabProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Snap a receipt"
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={[colors.brandPrimary, colors.brandSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, style]}
      >
        <Text style={styles.label}>Snap</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    minWidth: 92,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
