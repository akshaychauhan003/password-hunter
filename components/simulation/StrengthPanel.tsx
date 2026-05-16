'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { analysePassword } from '@/lib/passwordAnalyzer';

interface StrengthPanelProps { password: string; }

const SCORE_COLOR = (score: number) =>
  score < 20 ? '#FF2020' : score < 40 ? '#FF6600' : score < 60 ? '#FFBB00' : score < 80 ? '#00FF88' : '#00FFFF';

export default function StrengthPanel({ password }: StrengthPanelProps) {
  const analysis = useMemo(() => analysePassword(password), [password]);

  return (
    <div className="space-y-4">
      {/* Score bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Strength</span>
          <span className="text-xs font-mono font-bold" style={{ color: SCORE_COLOR(analysis.score) }}>
            {analysis.label}
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #FF2020, #FFBB00, #00FF88, #00FFFF)`, backgroundSize: '400% 100%', backgroundPosition: `${100 - analysis.score}% 0` }}
            animate={{ width: `${analysis.score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/3 rounded-lg p-3 border border-white/5">
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Entropy</p>
          <p className="text-sm font-mono font-bold text-neon-cyan">
            {analysis.entropy > 0 ? `${analysis.entropy.toFixed(1)} bits` : '—'}
          </p>
        </div>
        <div className="bg-white/3 rounded-lg p-3 border border-white/5">
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Difficulty</p>
          <p className="text-sm font-mono font-bold text-neon-amber">{analysis.difficultyLevel}</p>
        </div>
      </div>

      {/* Crack time */}
      {password && (
        <div className="bg-neon-red/5 border border-neon-red/20 rounded-lg p-3">
          <p className="text-[9px] font-mono text-neon-red/60 uppercase tracking-widest mb-1">Real-world crack estimate</p>
          <p className="text-sm font-mono font-bold text-neon-red">{analysis.crackTimeDisplay}</p>
        </div>
      )}

      {/* Character diversity */}
      {password && (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'a-z', active: analysis.charDiversity.hasLower },
            { label: 'A-Z', active: analysis.charDiversity.hasUpper },
            { label: '0-9', active: analysis.charDiversity.hasDigit },
            { label: '!@#', active: analysis.charDiversity.hasSymbol },
          ].map(({ label, active }) => (
            <div key={label} className={`text-center py-1.5 rounded text-[10px] font-mono font-bold border transition-colors ${
              active ? 'border-neon-green/40 text-neon-green bg-neon-green/10' : 'border-white/10 text-white/20'
            }`}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && password && (
        <div className="space-y-1">
          {analysis.weaknesses.slice(0, 3).map((w, i) => (
            <p key={i} className="text-[11px] font-mono text-neon-red/70 flex items-start gap-1.5">
              <span className="text-neon-red mt-0.5">✗</span>{w}
            </p>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && password && (
        <div className="space-y-1">
          {analysis.suggestions.slice(0, 2).map((s, i) => (
            <p key={i} className="text-[11px] font-mono text-neon-green/60 flex items-start gap-1.5">
              <span className="text-neon-green mt-0.5">✓</span>{s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
