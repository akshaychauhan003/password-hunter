/**
 * Index-by-index brute-force engine.
 *
 * Instead of enumerating all possible strings of length 1..N until we hit the
 * exact target, we crack the password one *position* at a time:
 *
 *   position 0 → try every char in the charset until target[0] matches
 *   position 1 → try every char in the charset until target[1] matches
 *   …
 *   position N-1 → try every char until target[N-1] matches → DONE
 *
 * This is the classic "sequential index" brute-force used in many educational
 * visualisations (think the Hollywood "character lights up green" effect).
 *
 * Total worst-case attempts = charsetSize × passwordLength
 * Average attempts per char = charsetSize / 2
 */

import type { CharsetMode, SimSpeed } from '@/types';
import { getCharset } from '@/lib/passwordAnalyzer';

/* ── Speed constants ─────────────────────────────────────────────────────── */

/** Simulated attempts-per-second at each speed tier */
export const SPEED_APS: Record<SimSpeed, number> = {
  slow:    200,
  normal:  2_000,
  fast:    20_000,
  instant: 200_000,
};

/** Milliseconds between UI ticks */
export const TICK_MS: Record<SimSpeed, number> = {
  slow:    150,
  normal:  60,
  fast:    25,
  instant: 16,
};

/** Visual candidate cycling steps per UI tick */
export const VISUAL_STEP: Record<SimSpeed, number> = {
  slow:    1,
  normal:  3,
  fast:    7,
  instant: 99,
};

/* ── Per-index plan ──────────────────────────────────────────────────────── */

export interface IndexPlan {
  /** The charset character that matches this position */
  targetChar: string;
  /** 0-based index of targetChar inside the charset */
  charsetIndex: number;
  /** Number of attempts needed to reach this char at this position
   *  (charsetIndex + 1 because we start from the first char) */
  attemptsForIndex: number;
}

export interface BruteForcePlan {
  charset: string;
  charsetSize: number;
  /** Per-position plan: indices[i] describes cracking position i */
  indices: IndexPlan[];
  /** Total attempts across all positions */
  totalAttempts: number;
  /** Shannon entropy in bits */
  entropy: number;
  /** Whether every target char exists in the charset */
  feasible: boolean;
  /** Cumulative attempts: cumAttempts[i] = sum of attempts for positions 0..i */
  cumAttempts: number[];
}

/**
 * Build a plan describing how many attempts each position will take
 * and which character is the answer at each position.
 */
export function buildBruteForcePlan(
  target: string,
  mode: CharsetMode,
  customCharset = '',
): BruteForcePlan {
  const charset     = getCharset(mode, customCharset);
  const charsetSize = Math.max(charset.length, 1);
  const length      = Math.max(target.length, 1);
  const entropy     = length * Math.log2(charsetSize);

  const indices: IndexPlan[] = [];
  let feasible = true;
  let totalAttempts = 0;
  const cumAttempts: number[] = [];

  for (let i = 0; i < target.length; i++) {
    const ch  = target[i];
    const idx = charset.indexOf(ch);
    if (idx === -1) {
      feasible = false;
      indices.push({ targetChar: ch, charsetIndex: -1, attemptsForIndex: charsetSize });
      totalAttempts += charsetSize;
    } else {
      const attempts = idx + 1; // we try charset[0], charset[1], …, charset[idx]
      indices.push({ targetChar: ch, charsetIndex: idx, attemptsForIndex: attempts });
      totalAttempts += attempts;
    }
    cumAttempts.push(totalAttempts);
  }

  return { charset, charsetSize, indices, totalAttempts, entropy, feasible, cumAttempts };
}

/* ── Runtime helpers for the simulation tick loop ────────────────────────── */

/**
 * Given a cumulative attempt count, determine which position index
 * is currently being cracked and how far into that position we are.
 *
 * Returns: { posIndex, attemptWithinPos, isMatch }
 */
export function positionAtAttempt(
  attempt: number,
  plan: BruteForcePlan,
): {
  lockedCount: number;
  posIndex: number;
  attemptWithinPos: number;
  candidateChar: string;
  found: boolean;
} {
  if (plan.indices.length === 0) {
    return {
      lockedCount: 0,
      posIndex: 0,
      attemptWithinPos: 0,
      candidateChar: '',
      found: true,
    };
  }

  let lockedCount = 0;
  while (lockedCount < plan.cumAttempts.length && attempt >= plan.cumAttempts[lockedCount]) {
    lockedCount += 1;
  }

  if (lockedCount >= plan.indices.length) {
    return {
      lockedCount: plan.indices.length,
      posIndex: plan.indices.length,
      attemptWithinPos: 0,
      candidateChar: '',
      found: true,
    };
  }

  const cumStart = lockedCount > 0 ? plan.cumAttempts[lockedCount - 1] : 0;
  const attemptWithinPos = Math.max(0, attempt - cumStart);
  const tryIdx = Math.min(Math.max(attemptWithinPos - 1, 0), plan.charset.length - 1);

  return {
    lockedCount,
    posIndex: lockedCount,
    attemptWithinPos,
    candidateChar: plan.charset[tryIdx] ?? '',
    found: false,
  };
}

/**
 * Build the display string showing:
 *  - Solved positions (correct chars, shown in order)
 *  - Current position  (the char currently being tried)
 *  - Future positions   (random chars from the charset)
 */
export function buildDisplayString(
  attempt: number,
  plan: BruteForcePlan,
  options: {
    includeCandidate?: boolean;
    suffixChar?: string;
    candidateOverride?: string;
  } = {},
): string {
  const {
    includeCandidate = false,
    suffixChar = '_',
    candidateOverride,
  } = options;
  const { lockedCount, candidateChar: actualCandidate, found } = positionAtAttempt(attempt, plan);
  const candidateChar = candidateOverride ?? actualCandidate;

  const lockedPrefix = plan.indices
    .slice(0, lockedCount)
    .map(({ targetChar }) => targetChar)
    .join('');

  if (!includeCandidate || found || !candidateChar) {
    if (!includeCandidate) {
      return lockedPrefix;
    }
    return lockedPrefix + suffixChar.repeat(Math.max(plan.indices.length - lockedCount, 0));
  }

  const remaining = Math.max(plan.indices.length - lockedCount - 1, 0);
  return lockedPrefix + candidateChar + suffixChar.repeat(remaining);
}

/**
 * Compute the number of attempts to process per UI tick at a given speed.
 */
export function batchSizeForSpeed(speed: SimSpeed): number {
  const aps    = SPEED_APS[speed];
  const tickMs = TICK_MS[speed];
  return Math.max(1, Math.round((aps * tickMs) / 1000));
}

/**
 * Estimated wall-clock ms to reach totalAttempts at given speed.
 */
export function estimateDiscoveryMs(totalAttempts: number, speed: SimSpeed): number {
  const aps = SPEED_APS[speed];
  return Math.ceil((totalAttempts / aps) * 1000);
}

/**
 * Format milliseconds for display.
 */
export function formatSimMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}.${String(ms % 1000).padStart(3, '0').slice(0, 2)}s`;
}
