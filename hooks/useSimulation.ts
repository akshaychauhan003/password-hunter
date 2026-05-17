'use client';
import { useState, useRef, useCallback } from 'react';
import { useSound } from '@/hooks/useSound';
import {
  calcDifficultyScore,
  getDifficultyFromScore,
  getEstimatedCrackTime,
  maskPassword,
} from '@/lib/passwordAnalyzer';
import {
  buildBruteForcePlan,
  buildDisplayString,
  positionAtAttempt,
  batchSizeForSpeed,
  estimateDiscoveryMs,
  formatSimMs,
  TICK_MS,
  SPEED_APS,
  VISUAL_STEP,
} from '@/lib/bruteForce';
import type { SimulationState, TerminalEntry, CharsetMode, SimSpeed } from '@/types';
import type { BruteForcePlan } from '@/lib/bruteForce';
import { nanoid } from 'nanoid';

export function useSimulation() {
  const sound = useSound();
  const runningRef     = useRef(false);
  const pausedRef      = useRef(false);
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootTimersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef   = useRef(0);
  const pauseAccRef    = useRef(0);
  const pauseStartRef  = useRef(0);
  const attemptRef     = useRef(0);
  const lastPosRef     = useRef(0); // number of locked positions already logged
  const visualCursorRef = useRef(0);
  const lastLockedRef   = useRef(0);

  const [state, setState] = useState<SimulationState>({
    isRunning: false, isPaused: false, isComplete: false, found: false,
    currentAttempt: '', activeIndex: 0, attemptCount: 0, attemptsPerSecond: 0,
    elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
    target: '', charset: '', mode: 'full', speed: 'normal',
  });
  const [logs, setLogs] = useState<TerminalEntry[]>([]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    bootTimersRef.current.forEach(clearTimeout);
    bootTimersRef.current = [];
  }, []);

  const addLog = useCallback((text: string, type: TerminalEntry['type'] = 'info') => {
    setLogs(prev => {
      const next = [...prev, { id: nanoid(6), text, type, timestamp: Date.now() }];
      return next.length > 300 ? next.slice(-250) : next;
    });
  }, []);

  const start = useCallback((
    target: string,
    mode: CharsetMode,
    speed: SimSpeed,
    customCharset?: string,
  ) => {
    if (!target) return;

    clearTimers();

    const plan = buildBruteForcePlan(target, mode, customCharset);
    const { charset, charsetSize, totalAttempts, entropy, feasible } = plan;

    if (!feasible) {
      addLog('⛔ Target contains characters outside the selected charset.', 'error');
      addLog(`▶ Mode: ${mode.toUpperCase()} — charset: [${charset.slice(0, 30)}${charset.length > 30 ? '…' : ''}]`, 'warning');
      addLog('▶ Switch to FULL mode or add missing characters to Custom.', 'warning');
      return;
    }

    const estMs = estimateDiscoveryMs(totalAttempts, speed);
    const batch = batchSizeForSpeed(speed);

    runningRef.current   = true;
    pausedRef.current    = false;
    pauseAccRef.current  = 0;
    attemptRef.current   = 0;
    lastPosRef.current   = 0;
    lastLockedRef.current = 0;
    visualCursorRef.current = 0;
    startTimeRef.current = Date.now();

    setLogs([]);
    setState({
      isRunning: true, isPaused: false, isComplete: false, found: false,
      currentAttempt: '', activeIndex: 0, attemptCount: 0, attemptsPerSecond: 0,
      elapsedMs: 0, progress: 0, estimatedTimeLeft: formatSimMs(estMs),
      target, charset, mode, speed,
    });

    // ── Boot logs ──
    const bootLogs = [
      { text: '▶ Initializing brute-force engine...', type: 'system' as const },
      { text: `▶ Target length: ${target.length} chars`, type: 'info' as const },
      { text: `▶ Charset: [${charset.slice(0, 20)}${charset.length > 20 ? '…' : ''}] (${charsetSize} chars)`, type: 'info' as const },
      { text: `▶ Entropy: ${entropy.toFixed(1)} bits`, type: 'info' as const },
      { text: `▶ Attack: INDEX-BY-INDEX (sequential per position)`, type: 'system' as const },
      { text: `▶ Mode: ${mode.toUpperCase()} · Speed: ${speed.toUpperCase()} (~${SPEED_APS[speed].toLocaleString()}/s)`, type: 'info' as const },
      { text: `▶ Est. total attempts: ${totalAttempts.toLocaleString()} across ${target.length} positions`, type: 'info' as const },
      { text: '▶ Starting index-by-index attack...', type: 'system' as const },
    ];

    let bootDelay = 0;
    bootLogs.forEach(({ text, type }) => {
      bootDelay += 120;
      const id = setTimeout(() => {
        if (runningRef.current) addLog(text, type);
      }, bootDelay);
      bootTimersRef.current.push(id);
    });

    let lastSpeedCheckTime  = Date.now();
    let lastSpeedCheckCount = 0;

    // ── Finish handler ──
    const finishSuccess = (matchAttempt: number, elapsedMs: number) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      clearTimers();

      addLog('', 'info');
      addLog('█████████████████████████████████████', 'success');
      addLog(`✅  PASSWORD FOUND: [${target}]`, 'success');
      addLog('█████████████████████████████████████', 'success');
      addLog(`▶ Total attempts: ${matchAttempt.toLocaleString()}`, 'info');
      addLog(`▶ Positions cracked: ${target.length}`, 'info');
      addLog(`▶ Time elapsed: ${formatSimMs(elapsedMs)}`, 'info');
      addLog(`▶ Charset size: ${charsetSize} characters`, 'info');
      addLog(`▶ Entropy: ${entropy.toFixed(1)} bits`, 'info');
      sound.playSuccess();

      const diffScore = calcDifficultyScore(target, charsetSize);

      setState(s => ({
        ...s,
        isRunning: false,
        isComplete: true,
        found: true,
        currentAttempt: target,
        activeIndex: plan.indices.length,
        attemptCount: matchAttempt,
        elapsedMs,
        progress: 1,
        estimatedTimeLeft: '0ms',
        attemptsPerSecond: elapsedMs > 0
          ? Math.round((matchAttempt / elapsedMs) * 1000)
          : matchAttempt,
      }));

      // Save to history
      fetch('/api/history', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target,
          maskedTarget:       maskPassword(target),
          totalAttempts:      matchAttempt,
          timeTakenMs:        Math.round(elapsedMs),
          modeUsed:           mode,
          difficultyLabel:    getDifficultyFromScore(diffScore),
          difficultyScore:    diffScore,
          estimatedCrackTime: getEstimatedCrackTime(charsetSize, target.length),
          charLength:         target.length,
          charsetSize,
          entropy,
        }),
      }).catch(() => {});
    };

    // ── Tick loop ──
    const tick = () => {
      if (!runningRef.current) return;

      if (pausedRef.current) {
        timerRef.current = setTimeout(tick, 100);
        return;
      }

      const now = Date.now();
      const elapsed = now - startTimeRef.current - pauseAccRef.current - bootDelay;
      if (elapsed < 0) {
        timerRef.current = setTimeout(tick, 50);
        return;
      }

      const remaining = totalAttempts - attemptRef.current;
      const steps     = Math.min(batch, remaining);

      for (let i = 0; i < steps; i++) {
        if (!runningRef.current) return;
        attemptRef.current += 1;
      }

      const attempts = attemptRef.current;
      const { lockedCount, found } = positionAtAttempt(attempts, plan);

      if (lockedCount > lastLockedRef.current) {
        visualCursorRef.current = 0;
      }
      lastLockedRef.current = lockedCount;

      // Log newly cracked positions immediately when they lock.
      if (lockedCount > lastPosRef.current) {
        for (let i = lastPosRef.current; i < lockedCount; i++) {
          const crackedChar = plan.indices[i].targetChar;
          const posAttempts = plan.indices[i].attemptsForIndex;
          addLog(
            `✓ Position ${i + 1}: '${crackedChar}' found after ${posAttempts} attempts`,
            'success',
          );
          sound.playWarning();
        }
        lastPosRef.current = lockedCount;
      }

      // Check for complete
      if (found || attempts >= totalAttempts) {
        finishSuccess(totalAttempts, elapsed);
        return;
      }

      const progress = Math.min(attempts / totalAttempts, 0.999);
      const visualCandidate = lockedCount >= plan.indices.length
        ? ''
        : speed === 'instant'
          ? plan.indices[lockedCount].targetChar
          : plan.charset[visualCursorRef.current] || plan.indices[lockedCount].targetChar;

      if (lockedCount < plan.indices.length && speed !== 'instant') {
        const visualStep = Math.min(VISUAL_STEP[speed], plan.charset.length);
        visualCursorRef.current = (visualCursorRef.current + visualStep) % plan.charset.length;
      }

      const displayStr = buildDisplayString(attempts, plan, {
        includeCandidate: true,
        candidateOverride: visualCandidate,
      });
      const attemptTrace = buildDisplayString(attempts, plan, {
        includeCandidate: true,
        suffixChar: '',
        candidateOverride: visualCandidate,
      });
      const remainMs = Math.max(0, ((totalAttempts - attempts) / SPEED_APS[speed]) * 1000);

      // APS measurement
      const secDiff = (now - lastSpeedCheckTime) / 1000;
      let displayAps = 0;
      if (secDiff > 0.25) {
        displayAps = Math.round((attempts - lastSpeedCheckCount) / secDiff);
        lastSpeedCheckTime  = now;
        lastSpeedCheckCount = attempts;
      }

      setState(s => ({
        ...s,
        currentAttempt: displayStr,
        activeIndex: lockedCount,
        attemptCount: attempts,
        attemptsPerSecond: displayAps,
        elapsedMs: elapsed,
        progress,
        estimatedTimeLeft: remainMs > 0 ? formatSimMs(remainMs) : '0ms',
      }));

      // Occasionally log the current attempt string
      if (attemptTrace && Math.random() < 0.05) {
        addLog(`> ${attemptTrace}`, 'attempt');
      }

      sound.playSimTick();
      timerRef.current = setTimeout(tick, TICK_MS[speed]);
    };

    timerRef.current = setTimeout(tick, bootDelay + 200);
  }, [addLog, clearTimers, sound]);

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = true;
    pauseStartRef.current = Date.now();
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pauseAccRef.current += Date.now() - pauseStartRef.current;
    pausedRef.current = false;
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    clearTimers();
    setState(s => ({ ...s, isRunning: false, isPaused: false }));
    addLog('⛔ Simulation halted by user.', 'warning');
  }, [addLog, clearTimers]);

  const reset = useCallback(() => {
    runningRef.current = false;
    clearTimers();
    attemptRef.current = 0;
    lastPosRef.current = 0;
    lastLockedRef.current = 0;
    visualCursorRef.current = 0;
    setLogs([]);
    setState({
      isRunning: false, isPaused: false, isComplete: false, found: false,
      currentAttempt: '', activeIndex: 0, attemptCount: 0, attemptsPerSecond: 0,
      elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
      target: '', charset: '', mode: 'full', speed: 'normal',
    });
  }, [clearTimers]);

  return { state, logs, start, pause, resume, stop, reset };
}
