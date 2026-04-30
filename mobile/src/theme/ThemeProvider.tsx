import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { type ColorTokens, lightColors, darkColors } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: ColorTokens;
  isDark: boolean;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
});

type ThemeProviderProps = PropsWithChildren<{
  mode?: ThemeMode;
}>;

export function ThemeProvider({ mode = 'system', children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const isDark =
      mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
    };
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
