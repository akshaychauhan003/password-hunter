/**
 * Full-string combination brute-force generator.
 * Produces candidates in length order: a, b, c, … aa, ab, … until maxLength.
 */

import type { CharsetMode, SimSpeed } from '@/types';
import { getCharset } from '@/lib/passwordAnalyzer';

export interface CandidateOracle {
  readonly targetLength: number;
  validateCandidate(candidate: string): boolean;
}

/** Sealed oracle — engine never reads target during ticks. */
export function createCandidateOracle(target: string): CandidateOracle {
  const sealed = target;
  return {
    targetLength: sealed.length,
    validateCandidate(candidate: string): boolean {
      return candidate === sealed;
    },
  };
}

export interface CombinationPlan {
  charset: string;
  charsetSize: number;
  maxLength: number;
  totalSearchSpace: number;
  attemptsUntilMatch: number;
  feasible: boolean;
  entropy: number;
}

export function buildCombinationPlan(
  target: string,
  mode: CharsetMode,
  customCharset = '',
): CombinationPlan {
  const charset = getCharset(mode, customCharset);
  const charsetSize = Math.max(charset.length, 1);
  const maxLength = Math.max(target.length, 1);
  const entropy = maxLength * Math.log2(charsetSize);

  let feasible = true;
  for (const ch of target) {
    if (!charset.includes(ch)) {
      feasible = false;
      break;
    }
  }

  let totalSearchSpace = 0;
  let pow = charsetSize;
  for (let len = 1; len <= maxLength; len++) {
    totalSearchSpace += pow;
    pow *= charsetSize;
  }

  const attemptsUntilMatch = feasible ? countAttemptsToReach(target, charset) : totalSearchSpace;

  return {
    charset,
    charsetSize,
    maxLength,
    totalSearchSpace,
    attemptsUntilMatch,
    feasible,
    entropy,
  };
}

/** Count attempts until target is reached in lexicographic length order. */
export function countAttemptsToReach(target: string, charset: string): number {
  const n = charset.length;
  let count = 0;

  for (let len = 1; len <= target.length; len++) {
    const indices = new Array(len).fill(0);
    while (true) {
      count++;
      const candidate = indices.map((i: number) => charset[i]).join('');
      if (candidate === target) return count;

      let carry = true;
      for (let i = len - 1; i >= 0 && carry; i--) {
        indices[i]++;
        if (indices[i] >= n) {
          indices[i] = 0;
        } else {
          carry = false;
        }
      }
      if (carry) break;
    }
  }

  return count;
}

/** Odometer-style combination generator (length 1 → maxLength). */
export class CombinationGenerator {
  private readonly charset: string;
  private readonly maxLength: number;
  private currentLength = 1;
  private indices: number[] = [0];
  private exhausted = false;

  constructor(charset: string, maxLength: number) {
    this.charset = charset;
    this.maxLength = Math.max(maxLength, 1);
  }

  get done(): boolean {
    return this.exhausted;
  }

  /** Current candidate without advancing. */
  peek(): string {
    return this.indices.map(i => this.charset[i]).join('');
  }

  /** Returns current candidate then advances state for the following call. */
  next(): string | null {
    if (this.exhausted) return null;

    const candidate = this.peek();

    if (this.incrementIndices()) {
      return candidate;
    }

    this.currentLength++;
    if (this.currentLength > this.maxLength) {
      this.exhausted = true;
      return candidate;
    }

    this.indices = new Array(this.currentLength).fill(0);
    return candidate;
  }

  private incrementIndices(): boolean {
    for (let i = this.indices.length - 1; i >= 0; i--) {
      this.indices[i]++;
      if (this.indices[i] < this.charset.length) return true;
      this.indices[i] = 0;
    }
    return false;
  }
}

export function formatAttemptLine(guess: string, target: string, matched: boolean): string {
  return `${guess} = ${target} → ${matched ? 'TRUE' : 'false'}`;
}

/** Attempts processed per UI tick by speed tier. */
export const COMBO_ATTEMPTS_PER_TICK: Record<SimSpeed, number> = {
  slow:    1,
  normal:  3,
  fast:    12,
  instant: 48,
};

export const COMBO_TICK_MS: Record<SimSpeed, number> = {
  slow:    140,
  normal:  55,
  fast:    28,
  instant: 16,
};

/** Max attempt lines kept in React state (older lines dropped). */
export const MAX_ATTEMPT_LINES_UI = 250;
