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

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  const sound = useSound();
  const containerRef = useRef<HTMLDivElement>(null);

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setShowCursor(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  // Schedule boot lines
  useEffect(() => {
    sound.playBoot();
    let cumulative = 400;
    BOOT_LINES.forEach((line, i) => {
      cumulative += line.delay;
      setTimeout(() => {
        setLines(prev => [...prev, line.text]);
        setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        sound.playTypingTick();
        containerRef.current?.scrollTo({ top: 9999, behavior: 'smooth' });
      }, cumulative);
    });
    // Transition after all lines
    setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 800);
    }, cumulative + 1200);
  }, []); // eslint-disable-line

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 bg-black retro-flicker flex flex-col"
        >
          {/* CRT scanlines */}
          <div className="pointer-events-none absolute inset-0 z-10"
            style={{ background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)' }} />

          {/* Screen vignette */}
          <div className="pointer-events-none absolute inset-0 z-10"
            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />

          <div className="relative z-20 flex flex-col h-full p-6 md:p-10 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-3">
              <span className="text-green-400 text-xs font-mono font-bold tracking-widest">
                PASSWORD HUNTER OS v1.0.0
              </span>
              <span className="text-green-300/60 text-xs font-mono">[SECURE BOOT]</span>
            </div>

            {/* Boot log */}
            <div ref={containerRef}
              className="flex-1 overflow-y-auto terminal-scroll"
              style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`font-mono text-sm leading-6 whitespace-pre ${
                    line.includes('READY') ? 'text-cyan-300 font-bold' :
                    line.includes('VERIFIED') || line.includes('[OK]') ? 'text-green-300' :
                    line.includes('billion') ? 'text-green-200/70' :
                    'text-green-500'
                  }`}
                >
                  {line}
                </motion.p>
              ))}
              {/* Blinking cursor */}
              <span className="font-mono text-green-400 text-sm">
                {showCursor ? '█' : ' '}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 border-t border-green-500/20 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-green-500/70 text-xs font-mono tracking-widest">LOADING SYSTEM...</span>
                <span className="text-cyan-400 text-xs font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-full h-1 bg-green-900/30 rounded overflow-hidden">
                <motion.div
                  className="h-full bg-green-400 rounded"
                  style={{ boxShadow: '0 0 8px #00FF41' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15, ease: 'linear' }}
                />
              </div>
              <p className="text-green-900/60 text-[9px] font-mono text-center mt-3 tracking-widest">
                © 2024 PASSWORD HUNTER — EDUCATIONAL USE ONLY
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
