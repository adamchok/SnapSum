import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const goNext = () => router.push('/onboarding/model' as any);

  const onAllowCamera = async () => {
    await requestPermission();
    goNext();
  };

  const cameraGranted = permission?.granted;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.ink900 }]}>Almost there</Text>
        <Text style={[styles.body, { color: colors.ink700 }]}>
          SnapSum needs camera access to scan your receipts. Your photos never leave your device.
        </Text>

        <View style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.cardTitle, { color: colors.ink900 }]}>Camera</Text>
          <Text style={[styles.cardHint, { color: colors.ink500 }]}>
            {cameraGranted ? 'Access granted' : 'Required for receipt scanning'}
          </Text>
        </View>

        <View style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.cardTitle, { color: colors.ink900 }]}>Local-only mode</Text>
          <Text style={[styles.cardHint, { color: colors.ink500 }]}>
            All data stays on this device. Cloud sync is optional and can be enabled later in Settings.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!cameraGranted ? (
          <Pressable
            onPress={onAllowCamera}
            style={[styles.primaryButton, { backgroundColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Allow camera and continue"
          >
            <Text style={styles.primaryLabel}>Allow camera & continue</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            style={[styles.primaryButton, { backgroundColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
          >
            <Text style={styles.primaryLabel}>Continue</Text>
          </Pressable>
        )}

        {!cameraGranted && (
          <Pressable
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Skip camera permission"
          >
            <Text style={[styles.skipLabel, { color: colors.ink500 }]}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 13,
  },
  actions: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: spacing.sm,
  },
});
