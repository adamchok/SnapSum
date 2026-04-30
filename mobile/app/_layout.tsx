import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../src/providers/AppProviders';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useIsOnboarded, useThemePref } from '../src/features/prefs/hooks';
import { BiometricGate } from '../src/components/BiometricGate';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useTheme();
  const { isOnboarded, isLoading } = useIsOnboarded();

  useEffect(() => {
    if (isLoading) return;
    const inOnboarding = segments[0] === 'onboarding';

    if (!isOnboarded && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (isOnboarded && inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [isOnboarded, isLoading, segments]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceBase },
          headerTintColor: colors.ink900,
          contentStyle: { backgroundColor: colors.surfaceBase },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="capture"
          options={{ title: 'Review Transaction', presentation: 'modal' }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{ title: 'Transaction' }}
        />
        <Stack.Screen
          name="transaction/new"
          options={{ title: 'Add Transaction', presentation: 'modal' }}
        />
        <Stack.Screen
          name="budgets/new"
          options={{ title: 'Create Budget', presentation: 'modal' }}
        />
        <Stack.Screen
          name="budgets/[id]"
          options={{ title: 'Budget' }}
        />
      </Stack>
    </>
  );
}

function ThemedRoot() {
  const themePref = useThemePref();
  return (
    <ThemeProvider mode={themePref}>
      <BiometricGate>
        <RootNavigator />
      </BiometricGate>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedRoot />
    </AppProviders>
  );
}
