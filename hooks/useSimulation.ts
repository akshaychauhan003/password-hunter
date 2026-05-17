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
  const visualPosRef    = useRef(0);
  const lastApsRef      = useRef(0);
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
    visualPosRef.current = 0;
    lastApsRef.current = 0;
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
      const { lockedCount: mathLockedCount, attemptWithinPos, found: mathFound } = positionAtAttempt(attempts, plan);

      // --- VISUAL CATCH-UP LOGIC ---
      if (speed !== 'instant' && visualPosRef.current < plan.indices.length) {
        if (visualPosRef.current < mathLockedCount) {
          const targetIdx = plan.indices[visualPosRef.current].charsetIndex;
          visualCursorRef.current += VISUAL_STEP[speed];
          
          if (visualCursorRef.current >= targetIdx) {
            visualPosRef.current++;
            visualCursorRef.current = 0;
          }
        } else if (visualPosRef.current === mathLockedCount && mathLockedCount < plan.indices.length) {
          const mathTryIdx = Math.min(Math.max(attemptWithinPos - 1, 0), plan.charset.length - 1);
          visualCursorRef.current += VISUAL_STEP[speed];
          if (visualCursorRef.current > mathTryIdx) {
            visualCursorRef.current = mathTryIdx;
          }
        }
      }

      const currentVisualLocked = speed === 'instant' ? mathLockedCount : visualPosRef.current;
      const isMathComplete = mathFound || attempts >= totalAttempts;
      const isVisualComplete = speed === 'instant' ? isMathComplete : currentVisualLocked >= plan.indices.length;

      // Log newly cracked positions immediately when they VISUALLY lock.
      if (currentVisualLocked > lastPosRef.current) {
        for (let i = lastPosRef.current; i < currentVisualLocked; i++) {
          const crackedChar = plan.indices[i].targetChar;
          const posAttempts = plan.indices[i].attemptsForIndex;
          addLog(
            `✓ Position ${i + 1}: '${crackedChar}' found after ${posAttempts} attempts`,
            'success',
          );
          sound.playWarning();
        }
        lastPosRef.current = currentVisualLocked;
      }

      // Check for complete
      if (isMathComplete && isVisualComplete) {
        const finalElapsedMs = (totalAttempts / SPEED_APS[speed]) * 1000;
        finishSuccess(totalAttempts, finalElapsedMs);
        return;
      }

      let visualCandidate = '';
      if (currentVisualLocked < plan.indices.length) {
        visualCandidate = speed === 'instant'
          ? plan.indices[currentVisualLocked].targetChar
          : plan.charset[visualCursorRef.current] ?? plan.charset[plan.charset.length - 1];
      }

      const lockedPrefix = plan.indices
        .slice(0, currentVisualLocked)
        .map(i => i.targetChar)
        .join('');

      let displayStr = lockedPrefix;
      if (currentVisualLocked < plan.indices.length) {
        displayStr += visualCandidate;
        const remainChars = plan.indices.length - currentVisualLocked - 1;
        if (remainChars > 0) displayStr += '_'.repeat(remainChars);
      }

      const attemptTrace = displayStr;

      // UI Stats - Calculate interpolated attempts based on visual state
      let uiAttempts = attempts;
      if (speed !== 'instant') {
        const baseAttempts = currentVisualLocked > 0 ? plan.cumAttempts[currentVisualLocked - 1] : 0;
        const currentPosTarget = currentVisualLocked < plan.indices.length ? plan.indices[currentVisualLocked].attemptsForIndex : 0;
        const addedAttempts = Math.min(visualCursorRef.current + 1, currentPosTarget);
        uiAttempts = Math.min(totalAttempts, baseAttempts + addedAttempts);
      }

      const progress = Math.min(uiAttempts / totalAttempts, 0.999);
      const uiElapsed = (uiAttempts / SPEED_APS[speed]) * 1000;
      const remainMs = Math.max(0, ((totalAttempts - uiAttempts) / SPEED_APS[speed]) * 1000);

      // APS measurement (Jitter around the target APS to simulate real-time performance)
      const secDiff = (now - lastSpeedCheckTime) / 1000;
      let displayAps = lastApsRef.current || SPEED_APS[speed];
      if (secDiff > 0.25) {
        const jitter = 1 + (Math.random() * 0.1 - 0.05);
        displayAps = Math.round(SPEED_APS[speed] * jitter);
        lastSpeedCheckTime  = now;
        lastApsRef.current = displayAps;
      }

      setState(s => ({
        ...s,
        currentAttempt: displayStr,
        activeIndex: currentVisualLocked,
        attemptCount: uiAttempts,
        attemptsPerSecond: speed === 'instant' ? SPEED_APS.instant : displayAps,
        elapsedMs: uiElapsed,
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
    visualPosRef.current = 0;
    lastApsRef.current = 0;
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
