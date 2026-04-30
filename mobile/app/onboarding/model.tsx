import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { useSetPref } from '../../src/features/prefs/hooks';
import { runtime, RuntimeState } from '../../src/features/receipt/localLLM/runtime';
import { markModelDownloaded } from '../../src/features/prefs/llmPrefs';
import { setLLMAdapter } from '../../src/features/receipt/pipeline';
import { executorchAdapter } from '../../src/features/receipt/localLLM/executorchAdapter';

export default function OnboardingModelScreen() {
  const { colors } = useTheme();
  const setPref = useSetPref();
  const [dlState, setDlState] = useState<RuntimeState>(runtime.state);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    return runtime.subscribe((s) => {
      setDlState(s);
      setError(runtime.error);
    });
  }, []);

  const finishOnboarding = useCallback(async () => {
    await setPref.mutateAsync({
      key: 'onboarded_at',
      value: new Date().toISOString(),
    });
    // Root layout's useEffect handles redirect to /(tabs)
  }, [setPref]);

  const onDownload = useCallback(async () => {
    try {
      await runtime.download((p) => setProgress(p));
      await markModelDownloaded();
      setLLMAdapter(executorchAdapter);
      await finishOnboarding();
    } catch {
      // Error shown in card, user can skip
    }
  }, [finishOnboarding]);

  const onCancel = useCallback(async () => {
    await runtime.cancelDownload();
    setProgress(0);
  }, []);

  const pct = Math.round(progress * 100);
  const isDownloading = dlState === 'downloading';
  const isLoading = dlState === 'loading';
  const isReady = dlState === 'ready';
  const isBusy = isDownloading || isLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { borderColor: colors.brandPrimary }]}>
          <Text style={styles.iconText}>🤖</Text>
        </View>

        <Text style={[styles.title, { color: colors.ink900 }]}>
          On-device AI parsing
        </Text>
        <Text style={[styles.body, { color: colors.ink700 }]}>
          Download a ~1.6 GB AI model to your device for smarter receipt scanning — no internet needed once it's here.
        </Text>

        {isAndroid ? (
          <View
            style={[
              styles.card,
              { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised },
            ]}
          >
            {!isBusy && !isReady && (
              <>
                <Text style={[styles.cardTitle, { color: colors.ink900 }]}>
                  LFM2-VL 1.6B
                </Text>
                <Text style={[styles.cardHint, { color: colors.ink500 }]}>
                  ~1.6 GB · Wi-Fi recommended · stays on your device
                </Text>
                {error && (
                  <Text style={[styles.cardHint, { color: colors.stateDanger }]}>
                    {error}
                  </Text>
                )}
              </>
            )}

            {isDownloading && (
              <>
                <Text style={[styles.cardTitle, { color: colors.ink900 }]}>
                  Downloading… {pct}%
                </Text>
                <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${pct}%`, backgroundColor: colors.brandPrimary },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel download"
                >
                  <Text style={[styles.cardHint, { color: colors.stateDanger, marginTop: spacing.xs }]}>
                    Cancel download
                  </Text>
                </Pressable>
                <Text style={[styles.cardHint, { color: colors.ink500 }]}>
                  Download continues in the background. You can also cancel and resume later from Settings.
                </Text>
              </>
            )}

            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.brandPrimary} />
                <Text style={[styles.cardHint, { color: colors.ink500, marginTop: 0 }]}>
                  Loading model into memory…
                </Text>
              </View>
            )}

            {isReady && (
              <Text style={[styles.cardTitle, { color: colors.stateSuccess }]}>
                ✓ Model ready — AI parsing active
              </Text>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.ink900 }]}>
              iOS support coming soon
            </Text>
            <Text style={[styles.cardHint, { color: colors.ink500 }]}>
              Receipt scanning still works via OCR + rules. AI parsing will arrive in a future update.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {isAndroid && !isReady && (
          <Pressable
            onPress={isBusy ? undefined : onDownload}
            style={[
              styles.primaryButton,
              {
                backgroundColor: isBusy ? colors.strokeSubtle : colors.brandPrimary,
              },
            ]}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={isBusy ? 'Downloading model' : 'Download AI model'}
          >
            <Text
              style={[
                styles.primaryLabel,
                { color: isBusy ? colors.ink500 : '#FFFFFF' },
              ]}
            >
              {isDownloading ? `Downloading… ${pct}%` : isLoading ? 'Loading…' : error ? 'Retry download' : 'Download now'}
            </Text>
          </Pressable>
        )}

        {isReady && (
          <Pressable
            onPress={finishOnboarding}
            style={[styles.primaryButton, { backgroundColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={[styles.primaryLabel, { color: '#FFFFFF' }]}>Get started</Text>
          </Pressable>
        )}

        {!isReady && (
          <Pressable
            onPress={finishOnboarding}
            accessibilityRole="button"
            accessibilityLabel="Skip AI model download"
          >
            <Text style={[styles.skipLabel, { color: colors.ink500 }]}>
              {isDownloading
                ? 'Continue — download will finish in background'
                : 'Skip — I\'ll download it in Settings'}
            </Text>
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
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
});
