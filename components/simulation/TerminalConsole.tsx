'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TerminalEntry } from '@/types';

interface TerminalConsoleProps {
  logs: TerminalEntry[];
  className?: string;
}

const TYPE_COLORS: Record<TerminalEntry['type'], string> = {
  info:    'text-sky-400',
  attempt: 'text-neon-green',
  warning: 'text-neon-amber',
  success: 'text-neon-cyan',
  system:  'text-purple-400',
  error:   'text-neon-red',
};
const TYPE_DOT: Record<TerminalEntry['type'], string> = {
  info:    'bg-sky-400',
  attempt: 'bg-neon-green',
  warning: 'bg-neon-amber',
  success: 'bg-neon-cyan',
  system:  'bg-purple-400',
  error:   'bg-neon-red',
};

export default function TerminalConsole({ logs, className = '' }: TerminalConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className={`rounded-xl border overflow-hidden ${className}`}
      style={{ background: 'var(--theme-bg-terminal)', borderColor: 'var(--theme-border)' }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-black/30"
        style={{ borderColor: 'var(--theme-border)' }}>
        <div className="w-3 h-3 rounded-full bg-neon-red/70" />
        <div className="w-3 h-3 rounded-full bg-neon-amber/70" />
        <div className="w-3 h-3 rounded-full bg-neon-green/70" />
        <span className="ml-2 text-[10px] font-mono theme-secondary-text opacity-50 tracking-widest uppercase">
          TERMINAL LOG — PASSWORD_HUNTER.EXE
        </span>
      </div>

      {/* Log lines */}
      <div className="h-56 overflow-y-auto terminal-scroll p-3 space-y-0.5 font-mono text-[11px]">
        {logs.length === 0 && (
          <p className="text-white/20 italic">Awaiting simulation...</p>
        )}
        {logs.map(entry => (
          <div key={entry.id} className="flex items-start gap-2">
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[entry.type]}`} />
            <span className={`leading-5 break-all whitespace-break-spaces ${TYPE_COLORS[entry.type]}`}>
              {entry.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
