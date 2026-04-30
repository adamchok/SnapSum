import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, radius } from '../theme/tokens';
import { usePref } from '../features/prefs/hooks';
import { authenticateWithBiometric } from '../features/security/biometric';

export function BiometricGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { data: biometricPref, isLoading } = usePref('biometric_enabled');
  const biometricEnabled = biometricPref === 'true';
  const [locked, setLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  // Tracks whether the cold-start lock has been handled for the current enable session.
  // Reset to false when biometric is disabled so re-enabling prompts immediately.
  const coldStartHandled = useRef(false);

  const tryUnlock = useCallback(async () => {
    const success = await authenticateWithBiometric();
    if (success) setLocked(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!biometricEnabled) {
      setLocked(false);
      coldStartHandled.current = false;
      return;
    }

    // On cold start (or when biometric is first enabled), lock immediately and
    // trigger auth. Without this, the app launches into 'active' state and the
    // background→foreground AppState transition never fires.
    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      setLocked(true);
      void tryUnlock();
    }

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          setLocked(true);
          void tryUnlock();
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [biometricEnabled, isLoading, tryUnlock]);

  if (locked) {
    return (
      <View style={[styles.lockScreen, { backgroundColor: colors.surfaceBase }]}>
        <View style={[styles.lockIcon, { borderColor: colors.brandPrimary }]}>
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>
        <Text style={[styles.lockTitle, { color: colors.ink900 }]}>SnapSum is locked</Text>
        <Pressable
          onPress={tryUnlock}
          style={[styles.unlockButton, { backgroundColor: colors.brandPrimary }]}
          accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
        >
          <Text style={styles.unlockLabel}>Unlock</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  unlockButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    minHeight: 48,
  },
  unlockLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
