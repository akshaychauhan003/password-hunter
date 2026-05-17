'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

const BOOT_LINES = [
  { text: 'BIOS v4.7.1 ...................... [OK]',         delay: 200 },
  { text: 'Initializing secure kernel ......... [OK]',      delay: 350 },
  { text: 'Loading encrypted modules .......... [OK]',      delay: 300 },
  { text: 'Mounting /sys/hunter ............... [OK]',      delay: 400 },
  { text: 'Verifying integrity checksums .........',        delay: 500 },
  { text: '  ├─ core.engine      [VERIFIED ✓]',             delay: 200 },
  { text: '  ├─ bruteforce.wasm  [VERIFIED ✓]',             delay: 200 },
  { text: '  └─ crypto.module    [VERIFIED ✓]',             delay: 200 },
  { text: 'Establishing secure terminal ........ [OK]',     delay: 400 },
  { text: 'Bypassing firewall layers ........... [3/3]',    delay: 350 },
  { text: 'Injecting brute-force engine .........',         delay: 300 },
  { text: 'Calibrating character matrices .......',         delay: 400 },
  { text: 'Allocating GPU compute shaders .......',         delay: 300 },
  { text: 'Loading rainbow tables ...............',          delay: 500 },
  { text: '  > 14.2 billion hashes indexed',                delay: 200 },
  { text: 'AI core activated .................. [OK]',       delay: 350 },
  { text: 'Initializing visual subsystem .......',          delay: 300 },
  { text: 'Connecting neural interface .........',          delay: 400 },
  { text: '[ PASSWORD HUNTER v1.0.0 — READY ]',             delay: 700 },
  { text: 'System ready. Welcome, Hunter.',                  delay: 600 },
];

interface BootScreenProps {
  onComplete: () => void;
}

function lineClass(line: string): string {
  if (line.includes('READY')) return 'boot-line-ready';
  if (line.includes('VERIFIED') || line.includes('[OK]')) return 'boot-line-ok';
  if (line.includes('billion')) return 'boot-line-dim';
  return 'boot-line-default';
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  const sound = useSound();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setShowCursor(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    sound.playBoot();
    let cumulative = 400;
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      cumulative += line.delay;
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, line.text]);
        setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        sound.playTypingTick();
        containerRef.current?.scrollTo({ top: 9999, behavior: 'smooth' });
      }, cumulative));
    });

    timers.push(setTimeout(() => {
      setDone(true);
      timers.push(setTimeout(onComplete, 800));
    }, cumulative + 1200));

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="boot-screen fixed inset-0 z-50 retro-flicker flex flex-col"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 boot-scanlines"
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }}
            aria-hidden
          />

          <div className="relative z-20 flex flex-col h-full p-6 md:p-10 max-w-3xl mx-auto w-full">
            <div
              className="flex justify-between items-center mb-4 pb-3"
              style={{ borderBottom: '1px solid var(--theme-border)' }}
            >
              <span className="text-xs font-mono font-bold tracking-widest boot-header-primary">
                PASSWORD HUNTER OS v1.0.0
              </span>
              <span className="text-xs font-mono boot-header-muted">[SECURE BOOT]</span>
            </div>

            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto terminal-scroll"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`font-mono text-sm leading-6 whitespace-pre ${lineClass(line)}`}
                >
                  {line}
                </motion.p>
              ))}
              <span className="font-mono text-sm boot-cursor">
                {showCursor ? '█' : ' '}
              </span>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-mono tracking-widest boot-header-muted">
                  LOADING SYSTEM...
                </span>
                <span className="text-xs font-mono font-bold boot-line-ready">{progress}%</span>
              </div>
              <div
                className="w-full h-1 rounded overflow-hidden"
                style={{ background: 'var(--theme-primary-faint)' }}
              >
                <motion.div
                  className="h-full rounded boot-progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15, ease: 'linear' }}
                />
              </div>
              <p className="text-[9px] font-mono text-center mt-3 tracking-widest boot-footer">
                © 2024 PASSWORD HUNTER — EDUCATIONAL USE ONLY
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
