'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AttemptLine } from '@/types';

const ROW_HEIGHT = 22;
const OVERSCAN = 8;

interface AttemptStreamProps {
  lines: AttemptLine[];
  isRunning: boolean;
  isComplete: boolean;
  className?: string;
}

export default function AttemptStream({
  lines,
  isRunning,
  isComplete,
  className = '',
}: AttemptStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(360);
  const autoScrollRef = useRef(true);

  const totalHeight = lines.length * ROW_HEIGHT;

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(lines.length, start + visibleCount);
    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * ROW_HEIGHT,
    };
  }, [scrollTop, containerHeight, lines.length]);

  const visibleLines = useMemo(
    () => lines.slice(startIndex, endIndex),
    [lines, startIndex, endIndex],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!autoScrollRef.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setScrollTop(scrollRef.current.scrollTop);
  }, [lines.length, isComplete]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    autoScrollRef.current = atBottom;
  }, []);

  return (
    <motion.div
      className={`rounded-xl border overflow-hidden flex flex-col ${className}`}
      style={{ background: 'var(--theme-bg-terminal)', borderColor: 'var(--theme-border)' }}
      initial={false}
      animate={
        isComplete
          ? { boxShadow: '0 0 24px color-mix(in srgb, var(--theme-primary) 40%, transparent)' }
          : {}
      }
    >
      <motion.div
        className="flex items-center gap-2 px-4 py-2 border-b bg-black/30 shrink-0"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <motion.div className="w-3 h-3 rounded-full bg-neon-red/70" />
        <motion.div className="w-3 h-3 rounded-full bg-neon-amber/70" />
        <motion.div className="w-3 h-3 rounded-full bg-neon-green/70" />
        <span className="ml-2 text-[10px] font-mono theme-secondary-text opacity-50 tracking-widest uppercase">
          LIVE BRUTE-FORCE STREAM
          {isRunning && (
            <span className="ml-2 text-neon-cyan animate-pulse">● REC</span>
          )}
        </span>
      </motion.div>

      <motion.div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-[280px] max-h-[min(52vh,420px)] sm:min-h-[320px] overflow-y-auto terminal-scroll relative"
      >
        {lines.length === 0 && (
          <p className="p-4 text-white/25 font-mono text-xs italic">
            {isRunning ? 'Generating combinations…' : 'Awaiting simulation…'}
          </p>
        )}

        <motion.div style={{ height: totalHeight, position: 'relative' }}>
          <motion.div
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
            }}
          >
            <AnimatePresence mode="popLayout">
              {visibleLines.map((line, i) => (
                <AttemptRow key={line.id} line={line} index={startIndex + i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function AttemptRow({ line, index }: { line: AttemptLine; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12 }}
      className="flex items-center gap-2 px-3 font-mono text-[11px] sm:text-xs leading-[22px]"
      style={{ height: ROW_HEIGHT }}
    >
      <span className="text-white/20 w-8 shrink-0 text-right tabular-nums">{index + 1}</span>
      <span
        className={`flex-1 break-all transition-colors duration-150 ${
          line.matched ? 'font-bold success-glow' : 'text-red-400/55'
        }`}
      >
        <span className={line.matched ? 'text-neon-cyan' : 'text-white/50'}>{line.guess}</span>
        <span className="text-white/30"> = </span>
        <span className="text-white/40">{line.target}</span>
        <span className="text-white/30"> → </span>
        <span className={line.matched ? 'text-neon-green' : 'text-red-400/70'}>
          {line.matched ? 'TRUE' : 'false'}
        </span>
      </span>
    </motion.div>
  );
}
