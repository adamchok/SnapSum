import { PropsWithChildren, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDatabase } from '../data/database';
import { setLLMAdapter } from '../features/receipt/pipeline';
import { executorchAdapter } from '../features/receipt/localLLM/executorchAdapter';
import { runtime } from '../features/receipt/localLLM/runtime';
import { isModelDownloaded, markModelDownloaded } from '../features/prefs/llmPrefs';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    getDatabase().catch(() => {
      // Keep startup resilient; database operations surface user-facing errors later.
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    (async () => {
      const downloaded = await isModelDownloaded();
      if (!downloaded) return;

      await runtime.ensureLoaded();
      if (runtime.state === 'ready') {
        setLLMAdapter(executorchAdapter);
      }
    })();

    // Listen for background download completing (e.g. started during
    // onboarding, user skipped to home, download finishes later).
    const unsub = runtime.subscribe(async (state) => {
      if (state === 'ready') {
        setLLMAdapter(executorchAdapter);
        await markModelDownloaded();
      }
    });
    return unsub;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GestureHandlerRootView>
  );
}
