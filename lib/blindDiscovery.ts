/**
 * Blind Discovery Mode — validation-only password reconstruction.
 *
 * After the eye closes, simulation code must NOT read the target string.
 * Only validateChar(index, candidate) may be used during the attack loop.
 */

import type { CharsetMode, SimSpeed, DiscoveryMode } from '@/types';
import { getCharset } from '@/lib/passwordAnalyzer';
import { SPEED_APS, TICK_MS, VISUAL_STEP, batchSizeForSpeed } from '@/lib/bruteForce';

export interface ValidationOracle {
  readonly length: number;
  validateChar(index: number, candidate: string): boolean;
}

/** Sealed oracle — target is closed over and never exposed. */
export function createValidationOracle(target: string): ValidationOracle {
  const sealed = target;
  return {
    length: sealed.length,
    validateChar(index: number, candidate: string): boolean {
      if (index < 0 || index >= sealed.length || candidate.length !== 1) return false;
      return sealed[index] === candidate;
    },
  };
}

export interface BlindDiscoveryPlan {
  oracle: ValidationOracle;
  charset: string;
  charsetSize: number;
  totalAttempts: number;
  entropy: number;
  feasible: boolean;
}

/**
 * One-time setup: checks charset feasibility (reads target only here, not during ticks).
 */
export function buildBlindDiscoveryPlan(
  target: string,
  mode: CharsetMode,
  customCharset = '',
): BlindDiscoveryPlan {
  const charset = getCharset(mode, customCharset);
  const charsetSize = Math.max(charset.length, 1);
  const oracle = createValidationOracle(target);
  const length = target.length;
  const entropy = length * Math.log2(charsetSize);

  let feasible = true;
  let totalAttempts = 0;

  for (let i = 0; i < length; i++) {
    const idx = charset.indexOf(target[i]);
    if (idx === -1) {
      feasible = false;
      totalAttempts += charsetSize;
    } else {
      totalAttempts += idx + 1;
    }
  }

  return { oracle, charset, charsetSize, totalAttempts, entropy, feasible };
}

export interface BlindTickState {
  posIndex: number;
  charsetCursor: number;
  attempts: number;
  discovered: string[];
  currentCandidate: string;
}

export function createBlindTickState(length: number): BlindTickState {
  return {
    posIndex: 0,
    charsetCursor: 0,
    attempts: 0,
    discovered: Array.from({ length }, () => ''),
    currentCandidate: '',
  };
}

export interface BlindTickResult {
  state: BlindTickState;
  found: boolean;
  newlyLocked: { index: number; char: string; attemptsAtPos: number } | null;
  logMessages: string[];
}

/**
 * Advance blind discovery by up to `steps` validation attempts.
 * Never reads the target string — only validateChar.
 */
export function advanceBlindDiscovery(
  plan: BlindDiscoveryPlan,
  state: BlindTickState,
  steps: number,
): BlindTickResult {
  const { oracle, charset } = plan;
  const logMessages: string[] = [];
  let newlyLocked: BlindTickResult['newlyLocked'] = null;
  const posAttemptsStart = state.attempts;

  for (let s = 0; s < steps; s++) {
    if (state.posIndex >= oracle.length) break;

    const candidate = charset[state.charsetCursor] ?? '';
    state.currentCandidate = candidate;
    state.attempts += 1;

    if (oracle.validateChar(state.posIndex, candidate)) {
      state.discovered[state.posIndex] = candidate;
      const attemptsAtPos = state.attempts - posAttemptsStart;
      newlyLocked = { index: state.posIndex, char: candidate, attemptsAtPos };
      logMessages.push(`▶ ACCESSING INDEX ${state.posIndex + 1}...`);
      logMessages.push(`✓ MATCH FOUND: '${candidate}' at position ${state.posIndex + 1}`);
      logMessages.push(`▶ VERIFYING CHARACTER... OK`);
      logMessages.push(`▶ CHARACTER LOCKED [${state.discovered.slice(0, state.posIndex + 1).join('')}]`);
      state.posIndex += 1;
      state.charsetCursor = 0;
      break;
    }

    state.charsetCursor += 1;
    if (state.charsetCursor >= charset.length) {
      state.charsetCursor = 0;
    }
  }

  return {
    state,
    found: state.posIndex >= oracle.length,
    newlyLocked,
    logMessages,
  };
}

/** Build display string for blind mode UI. */
export function buildBlindDisplayString(state: BlindTickState, length: number): string {
  const locked = state.discovered.slice(0, state.posIndex).join('');
  if (state.posIndex >= length) return locked;

  const active = state.currentCandidate || '';
  const remain = length - state.posIndex - 1;
  return locked + active + (remain > 0 ? '_'.repeat(remain) : '');
}

export function blindVisualStepsForSpeed(speed: SimSpeed): number {
  return VISUAL_STEP[speed];
}

export { SPEED_APS, TICK_MS, batchSizeForSpeed };
