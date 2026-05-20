'use client';

import { useCallback, useState } from 'react';
import type { DiscoveryMode } from '@/types';

const SESSION_KEY = 'password-hunter-discovery-mode';

function readSession(): DiscoveryMode {
  if (typeof window === 'undefined') return 'open';
  const v = sessionStorage.getItem(SESSION_KEY);
  return v === 'blind' ? 'blind' : 'open';
}

/** Session-persisted eye mode (open = direct visibility, blind = closed eye). */
export function useDiscoveryMode() {
  const [mode, setModeState] = useState<DiscoveryMode>(readSession);

  const setMode = useCallback((next: DiscoveryMode) => {
    setModeState(next);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, next);
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'open' ? 'blind' : 'open');
  }, [mode, setMode]);

  const isEyeOpen = mode === 'open';

  return { mode, setMode, toggle, isEyeOpen };
}
