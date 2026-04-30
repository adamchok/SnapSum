import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, radius } from '../theme/tokens';
import { runtime, RuntimeState } from '../features/receipt/localLLM/runtime';
import { markModelDownloaded, markModelRemoved } from '../features/prefs/llmPrefs';
import { setLLMAdapter } from '../features/receipt/pipeline';
import { executorchAdapter } from '../features/receipt/localLLM/executorchAdapter';
import { noopAdapter } from '../features/receipt/localLLM/noopAdapter';

type CardState = 'unavailable' | 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export function LocalAIDownloadCard() {
  const { colors } = useTheme();
  const [cardState, setCardState] = useState<CardState>(
    Platform.OS !== 'android' ? 'unavailable' : mapState(runtime.state),
  );
  const [progress, setProgress] = useState(runtime.downloadProgress);
  const [error, setError] = useState<string | null>(null);
  const [loadElapsed, setLoadElapsed] = useState(0);
  const loadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    return runtime.subscribe((s) => {
      const next = mapState(s);
      setCardState(next);
      setError(runtime.error);
      setProgress(runtime.downloadProgress);

      if (next === 'loading') {
        setLoadElapsed(0);
        loadTimerRef.current = setInterval(
          () => setLoadElapsed((n) => n + 1),
          1000,
        );
      } else {
        if (loadTimerRef.current) {
          clearInterval(loadTimerRef.current);
          loadTimerRef.current = null;
        }
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (loadTimerRef.current) clearInterval(loadTimerRef.current);
    };
  }, []);

  const onDownload = useCallback(async () => {
    try {
      await runtime.download((p) => setProgress(p));
      await markModelDownloaded();
      setLLMAdapter(executorchAdapter);
    } catch {
      // Error state handled by runtime subscription
    }
  }, []);

  const onCancel = useCallback(async () => {
    await runtime.cancelDownload();
    setProgress(0);
  }, []);

  const onDelete = useCallback(() => {
    Alert.alert(
      'Delete AI model',
      'This removes the ~1.6 GB model from your device. You can re-download it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            runtime.unload();
            await markModelRemoved();
            setLLMAdapter(noopAdapter);
          },
        },
      ],
    );
  }, []);

  if (cardState === 'unavailable') {
    return (
      <View style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
        <Text style={[styles.label, { color: colors.ink900 }]}>Local AI model</Text>
        <Text style={[styles.hint, { color: colors.ink500 }]}>
          Not available on this platform
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
      <Text style={[styles.label, { color: colors.ink900 }]}>Local AI model</Text>

      {cardState === 'idle' && (
        <>
          <Text style={[styles.hint, { color: colors.ink500 }]}>
            LFM2-VL 1.6B — ~1.6 GB download. Wi-Fi recommended.
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.brandPrimary }]}
            onPress={onDownload}
            accessibilityRole="button"
            accessibilityLabel="Download local AI model"
          >
            <Text style={styles.buttonText}>Download</Text>
          </Pressable>
        </>
      )}

      {cardState === 'downloading' && (
        <>
          <Text style={[styles.hint, { color: colors.ink500 }]}>
            Downloading... {Math.round(progress * 100)}%
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.brandPrimary },
              ]}
            />
          </View>
          <Pressable
            style={[styles.button, { backgroundColor: colors.stateDanger }]}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel model download"
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </>
      )}

      {cardState === 'loading' && (
        <>
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color={colors.brandPrimary}
              accessibilityLabel="Loading model"
            />
            <Text style={[styles.hint, { color: colors.ink500, marginTop: 0 }]}>
              Loading into memory…{loadElapsed > 0 ? ` ${loadElapsed}s` : ''}
            </Text>
          </View>
          <Text style={[styles.micro, { color: colors.ink500 }]}>
            Reading ~1.6 GB from disk — this takes 15–30 s on first load.
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
            <IndeterminateBar color={colors.brandPrimary} />
          </View>
        </>
      )}

      {cardState === 'ready' && (
        <>
          <Text style={[styles.hint, { color: colors.stateSuccess }]}>
            Ready — on-device receipt parsing active
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.stateDanger }]}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete local AI model"
          >
            <Text style={styles.buttonText}>Delete model</Text>
          </Pressable>
        </>
      )}

      {cardState === 'error' && (
        <>
          <Text style={[styles.hint, { color: colors.stateDanger }]}>
            {error ?? 'Download failed.'}
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.brandPrimary }]}
            onPress={onDownload}
            accessibilityRole="button"
            accessibilityLabel="Retry AI model download"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function IndeterminateBar({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ).start();
  }, [anim]);

  const left = anim.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] });
  const width = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['30%', '60%', '30%'] });

  return (
    <Animated.View
      style={[styles.progressFill, { left, width, backgroundColor: color }]}
    />
  );
}

function mapState(s: RuntimeState): CardState {
  switch (s) {
    case 'idle':
      return 'idle';
    case 'downloading':
      return 'downloading';
    case 'loading':
      return 'loading';
    case 'ready':
      return 'ready';
    case 'error':
      return 'error';
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
  },
});
