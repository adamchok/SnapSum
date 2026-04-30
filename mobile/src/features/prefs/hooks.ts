import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPref, setPref, deletePref, PrefKey } from './repository';

const prefKeys = {
  all: ['prefs'] as const,
  key: (k: PrefKey) => ['prefs', k] as const,
};

export function usePref(key: PrefKey) {
  return useQuery({
    queryKey: prefKeys.key(key),
    queryFn: () => getPref(key),
    staleTime: Infinity,
  });
}

export function useSetPref() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: PrefKey; value: string }) =>
      setPref(key, value),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: prefKeys.key(vars.key) });
    },
  });
}

export function useDeletePref() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: PrefKey) => deletePref(key),
    onSuccess: (_data, key) => {
      qc.invalidateQueries({ queryKey: prefKeys.key(key) });
    },
  });
}

export function useIsOnboarded() {
  const { data, isLoading } = usePref('onboarded_at');
  return { isOnboarded: data !== null && data !== undefined, isLoading };
}

export function useThemePref() {
  const { data } = usePref('theme');
  return (data as 'light' | 'dark' | 'system' | null) ?? 'system';
}

export function useBiometricEnabledPref() {
  const { data } = usePref('biometric_enabled');
  return data === 'true';
}
