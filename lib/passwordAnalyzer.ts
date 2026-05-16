import type { PasswordAnalysis, DifficultyLevel, CharsetMode } from '@/types';

const ATTACKER_HASHES_PER_SEC = 10_000_000_000;

export function analysePassword(password: string): PasswordAnalysis {
  if (!password) return emptyAnalysis();

  const hasLower  = /[a-z]/.test(password);
  const hasUpper  = /[A-Z]/.test(password);
  const hasDigit  = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const len       = password.length;

  let charsetSize = 0;
  if (hasLower)  charsetSize += 26;
  if (hasUpper)  charsetSize += 26;
  if (hasDigit)  charsetSize += 10;
  if (hasSymbol) charsetSize += 32;
  if (charsetSize === 0) charsetSize = 26;

  const entropy = len * Math.log2(charsetSize);
  const combinations = Math.pow(charsetSize, len);
  const avgSec = (combinations / 2) / ATTACKER_HASHES_PER_SEC;
  const crackTimeDisplay = formatCrackTime(avgSec);

  let score = Math.min(len * 4, 40);
  if (hasLower)  score += 10;
  if (hasUpper)  score += 15;
  if (hasDigit)  score += 15;
  if (hasSymbol) score += 20;
  if (isCommonPassword(password)) score = Math.max(0, score - 30);
  if (hasRepeatedChars(password)) score = Math.max(0, score - 10);
  if (hasSequential(password))    score = Math.max(0, score - 10);
  score = Math.min(100, score);

  const label =
    score < 20 ? 'Very Weak'   :
    score < 40 ? 'Weak'        :
    score < 60 ? 'Fair'        :
    score < 80 ? 'Strong'      : 'Very Strong';

  const weaknesses: string[] = [];
  if (len < 8)   weaknesses.push('Too short (< 8 characters)');
  if (!hasUpper) weaknesses.push('No uppercase letters');
  if (!hasDigit) weaknesses.push('No numbers');
  if (!hasSymbol) weaknesses.push('No special characters');
  if (hasRepeatedChars(password))   weaknesses.push('Repeated character patterns');
  if (hasSequential(password))      weaknesses.push('Sequential characters detected');
  if (isCommonPassword(password))   weaknesses.push('⚠ Common password — extremely vulnerable');

  const suggestions: string[] = [];
  if (len < 12)   suggestions.push('Use at least 12 characters');
  if (!hasUpper)  suggestions.push('Add uppercase letters (A-Z)');
  if (!hasDigit)  suggestions.push('Include numbers (0-9)');
  if (!hasSymbol) suggestions.push('Add special characters (!@#$%)');
  suggestions.push('Avoid dictionary words and names');
  suggestions.push('Consider using a passphrase');

  const difficultyLevel = getDifficultyFromScore(
    calcDifficultyScore(password, charsetSize)
  );

  return {
    score,
    label,
    entropy,
    charsetSize,
    crackTimeDisplay,
    charDiversity: { hasLower, hasUpper, hasDigit, hasSymbol },
    weaknesses,
    suggestions,
    difficultyLevel,
  };
}

export function calcDifficultyScore(password: string, charsetSize: number): number {
  const logCombinations = password.length * Math.log10(charsetSize);
  return Math.min(100, Math.round((logCombinations / 15) * 100));
}

export function getDifficultyFromScore(score: number): DifficultyLevel {
  if (score < 15) return 'Easy';
  if (score < 35) return 'Medium';
  if (score < 60) return 'Hard';
  if (score < 85) return 'Extreme';
  return 'Impossible';
}

export function getEstimatedCrackTime(charsetSize: number, length: number): string {
  const combinations = Math.pow(charsetSize, length);
  const avgSec = (combinations / 2) / ATTACKER_HASHES_PER_SEC;
  return formatCrackTime(avgSec);
}

export function getCharset(mode: CharsetMode, customCharset = ''): string {
  switch (mode) {
    case 'alpha':        return 'abcdefghijklmnopqrstuvwxyz';
    case 'numeric':      return '0123456789';
    case 'alphanumeric': return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    case 'full':         return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~ ';
    case 'custom':       return customCharset || 'abcdefghijklmnopqrstuvwxyz';
  }
}

export function maskPassword(pw: string): string {
  if (!pw || pw.length <= 2) return '***';
  return pw.slice(0, 2) + '*'.repeat(pw.length - 2);
}

function formatCrackTime(seconds: number): string {
  if (seconds < 0.001)               return 'Instant';
  if (seconds < 1)                   return `${(seconds * 1000).toFixed(0)} milliseconds`;
  if (seconds < 60)                  return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600)                return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400)               return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 2_592_000)           return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds < 31_536_000)          return `${(seconds / 2_592_000).toFixed(1)} months`;
  if (seconds < 31_536_000_000)      return `${(seconds / 31_536_000).toFixed(1)} years`;
  const centuries = seconds / (31_536_000 * 100);
  if (centuries < 1_000_000)         return `${centuries.toFixed(0)} centuries`;
  return 'Longer than the universe';
}

function hasRepeatedChars(pw: string): boolean {
  for (let i = 0; i < pw.length - 2; i++) {
    if (pw[i] === pw[i + 1] && pw[i] === pw[i + 2]) return true;
  }
  return false;
}

function hasSequential(pw: string): boolean {
  const l = pw.toLowerCase();
  for (let i = 0; i < l.length - 2; i++) {
    if (l.charCodeAt(i + 1) === l.charCodeAt(i) + 1 &&
        l.charCodeAt(i + 2) === l.charCodeAt(i) + 2) return true;
  }
  return false;
}

const COMMON_PASSWORDS = new Set([
  'password','123456','qwerty','abc123','letmein','monkey',
  '1234567890','iloveyou','admin','welcome','login','pass',
  'password1','12345678','111111','dragon','master','hello',
]);

function isCommonPassword(pw: string): boolean {
  return COMMON_PASSWORDS.has(pw.toLowerCase());
}

function emptyAnalysis(): PasswordAnalysis {
  return {
    score: 0, label: 'None', entropy: 0, charsetSize: 0,
    crackTimeDisplay: 'Instant',
    charDiversity: { hasLower: false, hasUpper: false, hasDigit: false, hasSymbol: false },
    weaknesses: ['No password entered'],
    suggestions: ['Enter a password to analyse'],
    difficultyLevel: 'Easy',
  };
}
