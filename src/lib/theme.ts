import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'cs_theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** 点击顺序：跟随系统 → 浅色 → 深色 → 跟随系统 */
export const THEME_ORDER: ThemeMode[] = ['system', 'light', 'dark'];

export const THEME_LABEL: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
};

/** 浏览器地址栏 / 状态栏配色，与 --color-bg 保持一致 */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#F7F6F3',
  dark: '#121211',
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DARK_QUERY).matches;

export const getStoredTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

/** 把主题写到 <html data-theme> 并同步 theme-color */
export const applyTheme = (theme: ResolvedTheme): void => {
  document.documentElement.dataset.theme = theme;

  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
};

export const nextThemeMode = (mode: ThemeMode): ThemeMode =>
  THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length];

export const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  const resolved: ResolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  // 写 DOM 与 meta，属于外部系统同步
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* 隐私模式下写不进去就算了，不影响当前会话 */
    }
  }, [mode]);

  // 跟随系统时实时响应系统外观切换
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [mode]);

  const cycle = useCallback(() => setMode((current) => nextThemeMode(current)), []);

  return { mode, resolved, setMode, cycle };
};
