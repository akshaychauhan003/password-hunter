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
  batchSizeForSpeed,
  estimateDiscoveryMs,
  formatSimMs,
  TICK_MS,
  SPEED_APS,
  VISUAL_STEP,
  positionAtAttempt,
} from '@/lib/bruteForce';
import {
  buildCombinationPlan,
  CombinationGenerator,
  createCandidateOracle,
  COMBO_ATTEMPTS_PER_TICK,
  COMBO_TICK_MS,
  MAX_ATTEMPT_LINES_UI,
} from '@/lib/combinationBruteForce';
import type { SimulationState, TerminalEntry, AttemptLine, CharsetMode, SimSpeed, DiscoveryMode } from '@/types';
import type { CombinationPlan } from '@/lib/combinationBruteForce';
import type { BruteForcePlan } from '@/lib/bruteForce';
import { nanoid } from 'nanoid';

const EMPTY_STATE: SimulationState = {
  isRunning: false, isPaused: false, isComplete: false, found: false,
  currentAttempt: '', activeIndex: 0, attemptCount: 0, attemptsPerSecond: 0,
  elapsedMs: 0, progress: 0, estimatedTimeLeft: '—',
  target: '', discoveredPassword: '', charset: '', mode: 'full', speed: 'normal',
  discoveryMode: 'open',
};

export function useSimulation() {
  const sound = useSound();
  const runningRef      = useRef(false);
  const pausedRef       = useRef(false);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootTimersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef    = useRef(0);
  const pauseAccRef     = useRef(0);
  const pauseStartRef   = useRef(0);
  const attemptRef      = useRef(0);
  const lastPosRef      = useRef(0);
  const visualCursorRef = useRef(0);
  const visualPosRef    = useRef(0);
  const lastApsRef      = useRef(0);
  const comboGenRef     = useRef<CombinationGenerator | null>(null);
  const discoveryModeRef = useRef<DiscoveryMode>('open');
  const sealedTargetRef  = useRef('');

  const [state, setState] = useState<SimulationState>(EMPTY_STATE);
  const [logs, setLogs] = useState<TerminalEntry[]>([]);
  const [attemptLines, setAttemptLines] = useState<AttemptLine[]>([]);

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

  const appendAttemptLines = useCallback((batch: AttemptLine[]) => {
    if (batch.length === 0) return;
    setAttemptLines(prev => {
      const next = [...prev, ...batch];
      return next.length > MAX_ATTEMPT_LINES_UI ? next.slice(-MAX_ATTEMPT_LINES_UI) : next;
    });
  }, []);

  const saveHistory = useCallback((
    target: string,
    matchAttempt: number,
    elapsedMs: number,
    mode: CharsetMode,
    discoveryMode: DiscoveryMode,
    charsetSize: number,
    entropy: number,
  ) => {
    const diffScore = calcDifficultyScore(target, charsetSize);
    fetch('/api/history', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        target,
        maskedTarget: maskPassword(target),
        totalAttempts: matchAttempt,
        timeTakenMs: Math.round(elapsedMs),
        modeUsed: mode,
        discoveryMode,
        eyeState: discoveryMode === 'blind' ? 'closed' : 'open',
        difficultyLabel: getDifficultyFromScore(diffScore),
        difficultyScore: diffScore,
        estimatedCrackTime: getEstimatedCrackTime(charsetSize, target.length),
        charLength: target.length,
        charsetSize,
        entropy,
      }),
    }).catch(() => {});
  }, []);

  const start = useCallback((
    target: string,
    mode: CharsetMode,
    speed: SimSpeed,
    customCharset?: string,
    discoveryMode: DiscoveryMode = 'open',
  ) => {
    if (!target) return;

    clearTimers();
    discoveryModeRef.current = discoveryMode;
    sealedTargetRef.current = target;

    if (discoveryMode === 'blind') {
      startBlind(target, mode, speed, customCharset);
    } else {
      startOpen(target, mode, speed, customCharset);
    }
  }, [addLog, clearTimers, saveHistory, sound]); // eslint-disable-line react-hooks/exhaustive-deps

  const startOpen = (
    target: string,
    mode: CharsetMode,
    speed: SimSpeed,
    customCharset?: string,
  ) => {
    const plan = buildBruteForcePlan(target, mode, customCharset);
    const { charset, charsetSize, totalAttempts, entropy, feasible } = plan;

    if (!feasible) {
      addLog('⛔ Target contains characters outside the selected charset.', 'error');
      addLog(`▶ Mode: ${mode.toUpperCase()} — charset: [${charset.slice(0, 30)}${charset.length > 30 ? '…' : ''}]`, 'warning');
      addLog('▶ Switch to FULL mode or add missing characters to Custom.', 'warning');
      return;
    }

    runOpenSimulation(target, plan, mode, speed, charset, charsetSize, totalAttempts, entropy);
  };

  const startBlind = (
    target: string,
    mode: CharsetMode,
    speed: SimSpeed,
    customCharset?: string,
  ) => {
    const plan = buildCombinationPlan(target, mode, customCharset);
    const { charset, charsetSize, feasible, entropy } = plan;

    if (!feasible) {
      addLog('⛔ Target contains characters outside the selected charset.', 'error');
      addLog(`▶ Mode: ${mode.toUpperCase()} — charset: [${charset.slice(0, 30)}${charset.length > 30 ? '…' : ''}]`, 'warning');
      addLog('▶ Switch to FULL mode or add missing characters to Custom.', 'warning');
      return;
    }

    runCombinationSearch(target, plan, mode, speed, entropy, charsetSize);
  };

  const runOpenSimulation = (
    target: string,
    plan: BruteForcePlan,
    mode: CharsetMode,
    speed: SimSpeed,
    charset: string,
    charsetSize: number,
    totalAttempts: number,
    entropy: number,
  ) => {
    const estMs = estimateDiscoveryMs(totalAttempts, speed);
    const batch = batchSizeForSpeed(speed);

    runningRef.current = true;
    pausedRef.current = false;
    pauseAccRef.current = 0;
    attemptRef.current = 0;
    lastPosRef.current = 0;
    visualCursorRef.current = 0;
    visualPosRef.current = 0;
    lastApsRef.current = 0;
    comboGenRef.current = null;
    startTimeRef.current = Date.now();

    setLogs([]);
    setState({
      ...EMPTY_STATE,
      isRunning: true,
      estimatedTimeLeft: formatSimMs(estMs),
      target,
      discoveredPassword: '',
      charset,
      mode,
      speed,
      discoveryMode: 'open',
    });

    const bootDelay = queueBootLogs(target, charset, charsetSize, entropy, mode, speed, totalAttempts, 'open');

    const finishSuccess = (matchAttempt: number, elapsedMs: number) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      clearTimers();

      addLog('', 'info');
      addLog('█████████████████████████████████████', 'success');
      addLog(`✅  PASSWORD FOUND: [${target}]`, 'success');
      addLog('█████████████████████████████████████', 'success');
      addLog(`▶ Total attempts: ${matchAttempt.toLocaleString()}`, 'info');
      addLog(`▶ Mode: OPEN EYE (direct visibility)`, 'info');
      sound.playSuccess();

      setState(s => ({
        ...s,
        isRunning: false,
        isComplete: true,
        found: true,
        currentAttempt: target,
        discoveredPassword: target,
        activeIndex: plan.indices.length,
        attemptCount: matchAttempt,
        elapsedMs,
        progress: 1,
        estimatedTimeLeft: '0ms',
        attemptsPerSecond: elapsedMs > 0 ? Math.round((matchAttempt / elapsedMs) * 1000) : matchAttempt,
      }));

      saveHistory(target, matchAttempt, elapsedMs, mode, 'open', charsetSize, entropy);
    };

    let lastSpeedCheckTime = Date.now();

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
      const steps = Math.min(batch, remaining);

      for (let i = 0; i < steps; i++) {
        if (!runningRef.current) return;
        attemptRef.current += 1;
      }

      const attempts = attemptRef.current;
      const { lockedCount: mathLockedCount, found: mathFound } = positionAtAttempt(attempts, plan);

      if (speed !== 'instant' && visualPosRef.current < plan.indices.length) {
        if (visualPosRef.current < mathLockedCount) {
          visualCursorRef.current += VISUAL_STEP[speed];
          const targetIdx = plan.indices[visualPosRef.current].charsetIndex;
          if (visualCursorRef.current >= targetIdx) {
            visualPosRef.current++;
            visualCursorRef.current = 0;
          }
        } else if (visualPosRef.current === mathLockedCount && mathLockedCount < plan.indices.length) {
          const mathTryIdx = Math.min(
            Math.max(positionAtAttempt(attempts, plan).attemptWithinPos - 1, 0),
            plan.charset.length - 1,
          );
          visualCursorRef.current += VISUAL_STEP[speed];
          if (visualCursorRef.current > mathTryIdx) visualCursorRef.current = mathTryIdx;
        }
      }

      const currentVisualLocked = speed === 'instant' ? mathLockedCount : visualPosRef.current;
      const isMathComplete = mathFound || attempts >= totalAttempts;
      const isVisualComplete = speed === 'instant' ? isMathComplete : currentVisualLocked >= plan.indices.length;

      if (currentVisualLocked > lastPosRef.current) {
        for (let i = lastPosRef.current; i < currentVisualLocked; i++) {
          addLog(`✓ Position ${i + 1}: '${plan.indices[i].targetChar}' found after ${plan.indices[i].attemptsForIndex} attempts`, 'success');
          sound.playWarning();
        }
        lastPosRef.current = currentVisualLocked;
      }

      if (isMathComplete && isVisualComplete) {
        finishSuccess(totalAttempts, (totalAttempts / SPEED_APS[speed]) * 1000);
        return;
      }

      let visualCandidate = '';
      if (currentVisualLocked < plan.indices.length) {
        visualCandidate = speed === 'instant'
          ? plan.indices[currentVisualLocked].targetChar
          : plan.charset[visualCursorRef.current] ?? plan.charset[plan.charset.length - 1];
      }

      const lockedPrefix = plan.indices.slice(0, currentVisualLocked).map(i => i.targetChar).join('');
      let displayStr = lockedPrefix;
      if (currentVisualLocked < plan.indices.length) {
        displayStr += visualCandidate;
        const remainChars = plan.indices.length - currentVisualLocked - 1;
        if (remainChars > 0) displayStr += '_'.repeat(remainChars);
      }

      let uiAttempts = attempts;
      if (speed !== 'instant') {
        const baseAttempts = currentVisualLocked > 0 ? plan.cumAttempts[currentVisualLocked - 1] : 0;
        const currentPosTarget = currentVisualLocked < plan.indices.length
          ? plan.indices[currentVisualLocked].attemptsForIndex
          : 0;
        uiAttempts = Math.min(totalAttempts, baseAttempts + Math.min(visualCursorRef.current + 1, currentPosTarget));
      }

      updateOpenUi(displayStr, currentVisualLocked, uiAttempts, totalAttempts, speed, now, lastSpeedCheckTime, (t) => { lastSpeedCheckTime = t; });
      if (displayStr && Math.random() < 0.05) addLog(`> ${displayStr}`, 'attempt');
      sound.playSimTick();
      timerRef.current = setTimeout(tick, TICK_MS[speed]);
    };

    timerRef.current = setTimeout(tick, bootDelay + 200);
  };

  const runCombinationSearch = (
    target: string,
    plan: CombinationPlan,
    mode: CharsetMode,
    speed: SimSpeed,
    entropy: number,
    charsetSize: number,
  ) => {
    const { charset, attemptsUntilMatch } = plan;
    const oracle = createCandidateOracle(target);
    const perTick = COMBO_ATTEMPTS_PER_TICK[speed];
    const tickMs = COMBO_TICK_MS[speed];
    const displayTarget = target;

    runningRef.current = true;
    pausedRef.current = false;
    pauseAccRef.current = 0;
    attemptRef.current = 0;
    lastApsRef.current = 0;
    startTimeRef.current = Date.now();
    comboGenRef.current = new CombinationGenerator(charset, plan.maxLength);

    setLogs([]);
    setAttemptLines([]);
    setState({
      ...EMPTY_STATE,
      isRunning: true,
      estimatedTimeLeft: formatSimMs((attemptsUntilMatch / perTick) * tickMs),
      target: displayTarget,
      discoveredPassword: '',
      charset,
      mode,
      speed,
      discoveryMode: 'blind',
    });

    const bootDelay = queueBootLogs(
      displayTarget,
      charset,
      charsetSize,
      entropy,
      mode,
      speed,
      attemptsUntilMatch,
      'blind',
    );

    addLog('▶ Attack: FULL COMBINATION SEARCH (length 1 → N)', 'system');
    addLog(`▶ Format: guess = ${displayTarget} → false | TRUE`, 'info');

    const finishCombo = (matchedGuess: string, totalAttempts: number, elapsedMs: number) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      clearTimers();

      addLog('', 'info');
      addLog('█████████████████████████████████████', 'success');
      addLog(`${matchedGuess} = ${displayTarget} → TRUE`, 'success');
      addLog('█████████████████████████████████████', 'success');
      addLog(`No. of attempts = ${totalAttempts.toLocaleString()}`, 'success');
      addLog(`Time taken = ${formatSimMs(elapsedMs)}`, 'success');
      sound.playSuccess();

      setState(s => ({
        ...s,
        isRunning: false,
        isComplete: true,
        found: true,
        currentAttempt: matchedGuess,
        discoveredPassword: matchedGuess,
        target: displayTarget,
        activeIndex: matchedGuess.length,
        attemptCount: totalAttempts,
        elapsedMs,
        progress: 1,
        estimatedTimeLeft: '0ms',
        attemptsPerSecond: elapsedMs > 0 ? Math.round((totalAttempts / elapsedMs) * 1000) : totalAttempts,
      }));

      saveHistory(sealedTargetRef.current, totalAttempts, elapsedMs, mode, 'blind', charsetSize, entropy);
    };

    let lastSpeedCheckTime = Date.now();

    const tick = () => {
      if (!runningRef.current || !comboGenRef.current) return;
      if (pausedRef.current) {
        timerRef.current = setTimeout(tick, 100);
        return;
      }

      const now = Date.now();
      const elapsedMs = Math.max(0, now - startTimeRef.current - pauseAccRef.current - bootDelay);
      const batch: AttemptLine[] = [];
      const gen = comboGenRef.current;

      for (let i = 0; i < perTick; i++) {
        const guess = gen.next();
        if (guess === null) {
          runningRef.current = false;
          addLog('⛔ Search space exhausted — no match found.', 'error');
          setState(s => ({ ...s, isRunning: false }));
          return;
        }

        attemptRef.current += 1;
        const matched = oracle.validateCandidate(guess);

        batch.push({
          id: nanoid(8),
          guess,
          target: displayTarget,
          matched,
          timestamp: now,
        });

        if (matched) {
          appendAttemptLines(batch);
          finishCombo(guess, attemptRef.current, elapsedMs);
          return;
        }
      }

      appendAttemptLines(batch);

      const attempts = attemptRef.current;
      const progress = Math.min(attempts / attemptsUntilMatch, 0.999);
      const remainAttempts = Math.max(0, attemptsUntilMatch - attempts);
      const remainMs = (remainAttempts / perTick) * tickMs;

      const secDiff = (now - lastSpeedCheckTime) / 1000;
      let displayAps = lastApsRef.current;
      if (secDiff >= 0.2) {
        displayAps = Math.round((batch.length / secDiff) * (1000 / tickMs));
        lastApsRef.current = displayAps;
        lastSpeedCheckTime = now;
      }

      const lastGuess = batch[batch.length - 1]?.guess ?? '';

      setState(s => ({
        ...s,
        currentAttempt: lastGuess,
        activeIndex: lastGuess.length,
        attemptCount: attempts,
        attemptsPerSecond: displayAps || Math.round(perTick * (1000 / tickMs)),
        elapsedMs,
        progress,
        estimatedTimeLeft: remainMs > 0 ? formatSimMs(remainMs) : '0ms',
        discoveredPassword: '',
      }));

      if (speed !== 'instant' || attempts % 4 === 0) {
        sound.playSimTick();
      }

      timerRef.current = setTimeout(tick, tickMs);
    };

    timerRef.current = setTimeout(tick, bootDelay + 300);
  };

  const queueBootLogs = (
    targetLabel: string,
    charset: string,
    charsetSize: number,
    entropy: number,
    mode: CharsetMode,
    speed: SimSpeed,
    totalAttempts: number,
    discoveryMode: DiscoveryMode,
  ): number => {
    const isBlind = discoveryMode === 'blind';
    const bootLogs = [
      { text: '▶ Initializing brute-force engine...', type: 'system' as const },
      { text: isBlind ? '▶ BLIND DISCOVERY MODE — target sealed from engine' : '▶ OPEN EYE MODE — direct visibility active', type: 'system' as const },
      { text: `▶ Target: ${targetLabel}`, type: 'info' as const },
      { text: `▶ Charset: [${charset.slice(0, 20)}${charset.length > 20 ? '…' : ''}] (${charsetSize} chars)`, type: 'info' as const },
      { text: `▶ Entropy: ${entropy.toFixed(1)} bits`, type: 'info' as const },
      { text: isBlind ? '▶ Attack: COMBINATION SEARCH (live attempt stream)' : '▶ Attack: INDEX-BY-INDEX (sequential per position)', type: 'system' as const },
      { text: `▶ Charset mode: ${mode.toUpperCase()} · Speed: ${speed.toUpperCase()} (~${SPEED_APS[speed].toLocaleString()}/s)`, type: 'info' as const },
      { text: `▶ Est. total attempts: ${totalAttempts.toLocaleString()}`, type: 'info' as const },
      { text: isBlind ? '▶ Starting combination brute-force...' : '▶ Starting index-by-index attack...', type: 'system' as const },
    ];

    let bootDelay = 0;
    bootLogs.forEach(({ text, type }) => {
      bootDelay += 120;
      const id = setTimeout(() => {
        if (runningRef.current) addLog(text, type);
      }, bootDelay);
      bootTimersRef.current.push(id);
    });
    return bootDelay;
  };

  const updateOpenUi = (
    displayStr: string,
    activeIndex: number,
    uiAttempts: number,
    totalAttempts: number,
    speed: SimSpeed,
    now: number,
    lastSpeedCheckTime: number,
    setLastCheck: (t: number) => void,
  ) => {
    const progress = Math.min(uiAttempts / totalAttempts, 0.999);
    const uiElapsed = (uiAttempts / SPEED_APS[speed]) * 1000;
    const remainMs = Math.max(0, ((totalAttempts - uiAttempts) / SPEED_APS[speed]) * 1000);
    const secDiff = (now - lastSpeedCheckTime) / 1000;
    let displayAps = lastApsRef.current || SPEED_APS[speed];
    if (secDiff > 0.25) {
      displayAps = Math.round(SPEED_APS[speed] * (1 + (Math.random() * 0.1 - 0.05)));
      setLastCheck(now);
      lastApsRef.current = displayAps;
    }
    setState(s => ({
      ...s,
      currentAttempt: displayStr,
      activeIndex,
      attemptCount: uiAttempts,
      attemptsPerSecond: speed === 'instant' ? SPEED_APS.instant : displayAps,
      elapsedMs: uiElapsed,
      progress,
      estimatedTimeLeft: remainMs > 0 ? formatSimMs(remainMs) : '0ms',
    }));
  };

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
    visualCursorRef.current = 0;
    visualPosRef.current = 0;
    lastApsRef.current = 0;
    comboGenRef.current = null;
    setLogs([]);
    setAttemptLines([]);
    setState(EMPTY_STATE);
  }, [clearTimers]);

  return { state, logs, attemptLines, start, pause, resume, stop, reset };
}
