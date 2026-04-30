import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { Screen } from '../../src/components/Screen';
import { exportTransactionsToCsv } from '../../src/features/transactions/exportCsv';
import {
  useBiometricEnabledPref,
  useSetPref,
  useThemePref,
} from '../../src/features/prefs/hooks';
import { isBiometricAvailable } from '../../src/features/security/biometric';
import { LocalAIDownloadCard } from '../../src/components/LocalAIDownloadCard';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const themePref = useThemePref();
  const biometricEnabled = useBiometricEnabledPref();
  const setPref = useSetPref();
  const [isExporting, setIsExporting] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBioAvailable).catch(() => setBioAvailable(false));
  }, []);

  const onExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportTransactionsToCsv();
      if (!result.shared) {
        Alert.alert('Export complete', `CSV saved at:\n${result.fileUri}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not export transactions.';
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleBiometric = () => {
    setPref.mutate({
      key: 'biometric_enabled',
      value: biometricEnabled ? 'false' : 'true',
    });
  };

  const cycleTheme = () => {
    const next = themePref === 'system' ? 'light' : themePref === 'light' ? 'dark' : 'system';
    setPref.mutate({ key: 'theme', value: next });
  };

  return (
    <Screen title="Settings" subtitle="Privacy and app preferences">
      <View style={styles.list}>
        <View style={[styles.row, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink900 }]}>Privacy mode</Text>
            <Text style={[styles.hint, { color: colors.ink500 }]}>On-device parsing only</Text>
          </View>
          <Text style={[styles.badge, { color: colors.stateSuccess }]}>Active</Text>
        </View>

        <Pressable
          style={[styles.row, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          onPress={cycleTheme}
          accessibilityRole="button"
          accessibilityLabel={`Theme: ${themePref}. Tap to change.`}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink900 }]}>Theme</Text>
            <Text style={[styles.hint, { color: colors.ink500 }]}>
              {themePref === 'system' ? 'Follow system' : themePref === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.ink500 }]}>→</Text>
        </Pressable>

        {bioAvailable && (
          <View style={[styles.row, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.ink900 }]}>App lock</Text>
              <Text style={[styles.hint, { color: colors.ink500 }]}>
                Require biometrics to open SnapSum
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.strokeSubtle, true: colors.brandPrimary }}
              accessibilityLabel="Toggle biometric app lock"
            />
          </View>
        )}

        <View style={[styles.row, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink900 }]}>Encrypted sync</Text>
            <Text style={[styles.hint, { color: colors.ink500 }]}>Coming soon — opt-in only</Text>
          </View>
        </View>

        <Pressable
          style={[styles.row, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          onPress={onExport}
          disabled={isExporting}
          accessibilityRole="button"
          accessibilityLabel="Export transactions to CSV"
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink900 }]}>CSV export</Text>
            <Text style={[styles.hint, { color: colors.ink500 }]}>
              {isExporting ? 'Exporting...' : 'Tap to export local transactions'}
            </Text>
          </View>
        </Pressable>

        <LocalAIDownloadCard />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 18,
  },
});
