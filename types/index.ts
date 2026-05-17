// ─── Core Types ───────────────────────────────────────────────

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Extreme' | 'Impossible';
export type ThemeName = 'hacker-green' | 'cyber-blue' | 'neon-purple' | 'red-matrix';
export type SimSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type CharsetMode = 'alpha' | 'numeric' | 'alphanumeric' | 'full' | 'custom';

// ─── Simulation ────────────────────────────────────────────────

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  currentAttempt: string;
  attemptCount: number;
  attemptsPerSecond: number;
  elapsedMs: number;
  progress: number;           // 0.0 – 1.0
  activeIndex: number;
  estimatedTimeLeft: string;
  found: boolean;
  target: string;
  charset: string;
  mode: CharsetMode;
  speed: SimSpeed;
}

export interface SimulationResult {
  id: string;
  target: string;            // the original password/text
  maskedTarget: string;      // first 2 chars + stars
  totalAttempts: number;
  elapsedMs: number;
  charsetMode: CharsetMode;
  charsetSize: number;
  difficultyLabel: DifficultyLevel;
  difficultyScore: number;   // 0–100
  estimatedRealCrackTime: string;
  entropy: number;
  createdAt: Date;
}

// ─── Password Analysis ─────────────────────────────────────────

export interface PasswordAnalysis {
  score: number;               // 0–100
  label: string;               // Very Weak … Very Strong
  entropy: number;
  charsetSize: number;
  crackTimeDisplay: string;
  charDiversity: {
    hasLower: boolean;
    hasUpper: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
  };
  weaknesses: string[];
  suggestions: string[];
  difficultyLevel: DifficultyLevel;
}

// ─── History ──────────────────────────────────────────────────

export interface HistoryItem {
  _id?: string;
  userId?: string;
  target: string;
  maskedTarget: string;
  dateTime: Date | string;
  totalAttempts: number;
  timeTakenMs: number;
  modeUsed: CharsetMode;
  difficultyLabel: DifficultyLevel;
  difficultyScore: number;
  estimatedCrackTime: string;
  charLength: number;
  charsetSize: number;
  entropy: number;
}

// ─── Terminal Log ─────────────────────────────────────────────

export type LogType = 'info' | 'attempt' | 'warning' | 'success' | 'system' | 'error';

export interface TerminalEntry {
  id: string;
  text: string;
  type: LogType;
  timestamp: number;
}

// ─── Settings ─────────────────────────────────────────────────

export interface AppSettings {
  theme: ThemeName;
  soundEnabled: boolean;
  volume: number;                // 0–100
  animationIntensity: number;    // 0–100
  particlesEnabled: boolean;
  simSpeed: SimSpeed;
  charsetMode: CharsetMode;
  customCharset: string;
}

// ─── API Responses ────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HistoryApiResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
}

// Theme labels & CSS variables: see @/lib/theme (single source of truth)
export { THEME_LABELS, THEME_IDS, DEFAULT_THEME } from '@/lib/theme';

// ─── Charset definitions ──────────────────────────────────────

export const CHARSETS: Record<CharsetMode, string> = {
  alpha:        'abcdefghijklmnopqrstuvwxyz',
  numeric:      '0123456789',
  alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  full:         'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~ ',
  custom:       '',
};

export const CHARSET_LABELS: Record<CharsetMode, string> = {
  alpha:        'Lowercase (a-z)',
  numeric:      'Numbers (0-9)',
  alphanumeric: 'Alphanumeric',
  full:         'Full ASCII',
  custom:       'Custom',
};
