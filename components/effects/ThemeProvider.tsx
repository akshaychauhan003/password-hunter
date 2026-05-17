'use client';
import { useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { applyThemeVars, getPersistedTheme } from '@/lib/theme';

export default function ThemeProvider() {
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);

  // Before paint: ensure DOM matches localStorage (guards against stale zustand default)
  useLayoutEffect(() => {
    const persisted = getPersistedTheme();
    applyThemeVars(persisted);
    if (persisted !== useAppStore.getState().theme) {
      setTheme(persisted);
    }
  }, [setTheme]);

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  return null;
}
