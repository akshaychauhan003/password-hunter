'use client';
import { useState, useRef, useCallback } from 'react';
import { useSound } from '@/hooks/useSound';
import { getCharset, calcDifficultyScore, getDifficultyFromScore, getEstimatedCrackTime, maskPassword } from '@/lib/passwordAnalyzer';
import type { SimulationState, TerminalEntry, CharsetMode, SimSpeed } from '@/types';
import { nanoid } from 'nanoid';

const SPEED_MAP: Record<SimSpeed, number> = {
  slow: 80, normal: 400, fast: 2000, instant: 0,
};

const SIM_DURATION_MAP: Record<SimSpeed, number> = {
  slow: 14000, normal: 14000, fast: 14000, instant: 1500,
};

// Fixed constants for display
const FIXED_ATTEMPTS = 12_000_000;
const FIXED_DISPLAY_TIME = 14000;

export function useSimulation() {
  const sound = useSound();
  const runningRef  = useRef(false);
  const pausedRef   = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const attemptRef  = useRef(0);

  const [state, setState] = useState<SimulationState>({
    isRunning: false, isPaused: false, isComplete: false, found: false,
    currentAttempt: '', attemptCount: 0, attemptsPerSecond: 0,
    elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
    target: '', charset: '', mode: 'alphanumeric', speed: 'normal',
  });
  const [logs, setLogs] = useState<TerminalEntry[]>([]);

  const addLog = useCallback((text: string, type: TerminalEntry['type'] = 'info') => {
    setLogs(prev => {
      const next = [...prev, { id: nanoid(6), text, type, timestamp: Date.now() }];
      return next.length > 300 ? next.slice(-250) : next;
    });
  }, []);

  const randomChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];

  const buildRevealSchedule = useCallback((target: string, charset: string): string[] => {
    const schedule: string[] = [];
    // Build array: each entry reveals one more correct char from left
    for (let i = 0; i <= target.length; i++) {
      let s = target.slice(0, i);
      for (let j = i; j < target.length; j++) s += randomChar(charset);
      schedule.push(s);
    }
    return schedule;
  }, []);

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}.${String(ms % 1000).padStart(3,'0').slice(0,2)}s`;
  };

  const start = useCallback((target: string, mode: CharsetMode, speed: SimSpeed, customCharset?: string) => {
    if (!target) return;
    runningRef.current  = true;
    pausedRef.current   = false;
    startTimeRef.current = Date.now();
    attemptRef.current  = 0;

    const charset = mode === 'custom' && customCharset ? customCharset : getCharset(mode);
    setLogs([]);

    setState({
      isRunning: true, isPaused: false, isComplete: false, found: false,
      currentAttempt: '', attemptCount: 0, attemptsPerSecond: 0,
      elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
      target, charset, mode, speed,
    });

    // Boot logs
    const bootLogs = [
      { text: '▶ Initializing brute-force engine...', type: 'system' as const },
      { text: `▶ Target length: ${target.length} characters`, type: 'info' as const },
      { text: `▶ Character set: [${charset.slice(0,20)}${charset.length > 20 ? '...' : ''}] (${charset.length} chars)`, type: 'info' as const },
      { text: `▶ Attack mode: ${mode.toUpperCase()}`, type: 'system' as const },
      { text: `▶ Speed profile: ${speed.toUpperCase()}`, type: 'info' as const },
      { text: '▶ Starting sequential attack...', type: 'system' as const },
    ];

    let bootDelay = 0;
    bootLogs.forEach(({ text, type }) => {
      bootDelay += 200;
      setTimeout(() => { if (runningRef.current) addLog(text, type); }, bootDelay);
    });

    // Simulation
    const totalMs   = SIM_DURATION_MAP[speed];
    const revealSchedule = buildRevealSchedule(target, charset);
    const revealInterval = totalMs / Math.max(revealSchedule.length, 1);

    const warnings = [
      '⚠ Hash collision attempt detected...',
      '⚠ Entropy increasing — adjusting vector...',
      '⚠ Pattern match probability rising...',
      '⚠ Firewall evasion layer active...',
      '⚠ Match confidence: INCREASING...',
      '⚠ GPU cluster at full capacity...',
    ];
    let warnIdx = 0;
    let nextWarnDelay = 3000 + Math.random() * 2000;
    let lastSpeedCheck = Date.now();
    let lastCount = 0;
    let revealIdx = 0;

    const tick = () => {
      if (!runningRef.current) return;
      if (pausedRef.current) { timerRef.current = setTimeout(tick, 100); return; }

      const now = Date.now();
      const elapsed = now - startTimeRef.current - bootDelay;
      if (elapsed < 0) { timerRef.current = setTimeout(tick, 50); return; }

      const progress = Math.min(elapsed / totalMs, 0.999);
      const attempts  = Math.floor(progress * progress * FIXED_ATTEMPTS);
      attemptRef.current = attempts;

      // Reveal schedule
      revealIdx = Math.min(Math.floor(elapsed / revealInterval), revealSchedule.length - 1);
      const baseAttempt = revealSchedule[revealIdx];
      // Jitter the unrevealed suffix
      let attempt = baseAttempt.slice(0, revealIdx);
      for (let i = revealIdx; i < target.length; i++) {
        attempt += Math.random() < 0.2 ? target[i] : randomChar(charset);
      }

      // APS
      const secDiff = (now - lastSpeedCheck) / 1000;
      const aps = secDiff > 0.5 ? (attempts - lastCount) / secDiff : 0;
      if (secDiff > 0.5) { lastSpeedCheck = now; lastCount = attempts; }

      const remainMs = Math.max(0, totalMs - elapsed);
      setState(s => ({ ...s,
        currentAttempt: attempt,
        attemptCount: attempts,
        attemptsPerSecond: Math.round(aps),
        elapsedMs: elapsed,
        progress,
        estimatedTimeLeft: formatMs(remainMs),
      }));

      // Log attempt occasionally
      if (Math.random() < 0.08) addLog(`> ${attempt}`, 'attempt');

      // Warning logs
      if (elapsed > nextWarnDelay && warnIdx < warnings.length) {
        addLog(warnings[warnIdx++], 'warning');
        sound.playWarning();
        nextWarnDelay = elapsed + 2000 + Math.random() * 3000;
      }

      sound.playSimTick();

      if (elapsed >= totalMs) {
        // SUCCESS
        runningRef.current = false;
        const finalAttempts = FIXED_ATTEMPTS;
        addLog('', 'info');
        addLog('█████████████████████████████████████', 'success');
        addLog(`✅  PASSWORD FOUND: [${target}]`, 'success');
        addLog('█████████████████████████████████████', 'success');
        addLog(`▶ Total attempts: ${(finalAttempts / 1_000_000).toFixed(1)}M`, 'info');
        addLog(`▶ Time elapsed:   14.00s`, 'info');
        sound.playSuccess();

        const diffScore = calcDifficultyScore(target, charset.length);
        setState(s => ({
          ...s, isRunning: false, isComplete: true, found: true,
          currentAttempt: target, attemptCount: FIXED_ATTEMPTS,
          progress: 1, estimatedTimeLeft: '0ms',
        }));

        // Save to DB
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        fetch(`${apiUrl}/api/history`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            target,
            maskedTarget: maskPassword(target),
            totalAttempts: FIXED_ATTEMPTS,
            timeTakenMs: FIXED_DISPLAY_TIME,
            modeUsed: mode,
            difficultyLabel: getDifficultyFromScore(diffScore),
            difficultyScore: diffScore,
            estimatedCrackTime: getEstimatedCrackTime(charset.length, target.length),
            charLength: target.length,
            charsetSize: charset.length,
            entropy: target.length * Math.log2(charset.length),
          }),
        }).catch(() => {});
        return;
      }

      const interval = speed === 'fast' ? 30 : speed === 'slow' ? 120 : 60;
      timerRef.current = setTimeout(tick, interval);
    };

    timerRef.current = setTimeout(tick, bootDelay + 400);
  }, [addLog, buildRevealSchedule, sound]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(s => ({ ...s, isRunning: false, isPaused: false }));
    addLog('⛔ Simulation halted by user.', 'warning');
  }, [addLog]);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setLogs([]);
    setState({
      isRunning: false, isPaused: false, isComplete: false, found: false,
      currentAttempt: '', attemptCount: 0, attemptsPerSecond: 0,
      elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
      target: '', charset: '', mode: 'alphanumeric', speed: 'normal',
    });
  }, []);

  return { state, logs, start, pause, resume, stop, reset };
}
