'use client';
import { useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useSound() {
  const { soundEnabled, volume } = useAppStore();
  const ctx = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'square') => {
    if (!soundEnabled) return;
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime((volume / 100) * 0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch { /* non-fatal */ }
  }, [soundEnabled, volume, getCtx]);

  return {
    playClick:       () => playTone(800, 0.04),
    playTypingTick:  () => playTone(200 + Math.random() * 300, 0.02),
    playNeonOn:      () => playTone(440, 0.15, 'sine'),
    playSuccess:     () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.1), 120); setTimeout(() => playTone(784, 0.2), 240); },
    playWarning:     () => playTone(220, 0.1, 'sawtooth'),
    playGlitch:      () => playTone(80 + Math.random() * 200, 0.05, 'sawtooth'),
    playBoot:        () => { [261,329,392,523].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'sine'), i * 160)); },
    playSimTick:     () => { if (Math.random() < 0.04) playTone(400 + Math.random() * 200, 0.015); },
    playDelete:      () => { playTone(300, 0.06); setTimeout(() => playTone(200, 0.08), 80); },
  };
}
