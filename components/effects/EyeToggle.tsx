'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

interface EyeToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function EyeToggle({ isOpen, onToggle, disabled = false }: EyeToggleProps) {
  const sound = useSound();

  const handleClick = () => {
    if (disabled) return;
    sound.playClick();
    onToggle();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isOpen ? 'Open Eye — direct visibility (demo mode)' : 'Closed Eye — blind discovery mode'}
      className="relative group flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: isOpen ? 'var(--theme-border-active)' : 'var(--theme-secondary)',
        background: isOpen ? 'var(--theme-primary-faint)' : 'rgba(0,0,0,0.4)',
        boxShadow: isOpen
          ? '0 0 20px color-mix(in srgb, var(--theme-primary) 35%, transparent)'
          : '0 0 24px color-mix(in srgb, var(--theme-secondary) 25%, transparent)',
      }}
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
    >
      {/* Scanline sweep */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-30"
        initial={false}
      >
        <motion.div
          className="absolute left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, var(--theme-primary), transparent)' }}
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Eye container */}
      <motion.div
        className="relative w-12 h-8 flex items-center justify-center"
        animate={isOpen ? { scaleY: 1 } : { scaleY: 0.15 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Outer eye shape */}
        <svg width="48" height="32" viewBox="0 0 48 32" className="absolute" aria-hidden>
          <ellipse
            cx="24"
            cy="16"
            rx="22"
            ry="14"
            fill="none"
            stroke="var(--theme-primary)"
            strokeWidth="1.5"
            opacity={0.9}
          />
        </svg>

        {/* Iris + pupil */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="open"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 35% 35%, var(--theme-secondary), var(--theme-primary))',
                boxShadow: '0 0 12px var(--theme-primary)',
              }}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-black"
                animate={{ x: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="closed"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute inset-x-1 h-[3px] rounded-full"
              style={{ background: 'var(--theme-primary)', boxShadow: '0 0 8px var(--theme-primary)' }}
            />
          )}
        </AnimatePresence>

        {/* Blink overlay */}
        {isOpen && (
          <motion.div
            className="absolute inset-0 bg-[var(--theme-bg)] origin-center"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 0.15, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 4 }}
            style={{ borderRadius: '50%' }}
          />
        )}
      </motion.div>

      {/* Shutter lines when closing */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-center gap-[3px] pointer-events-none px-2"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-[1px] w-full"
                style={{ background: 'var(--theme-primary)', opacity: 0.4 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <span
        className="text-[9px] font-mono font-bold tracking-widest uppercase z-10"
        style={{ color: isOpen ? 'var(--theme-primary)' : 'var(--theme-secondary)' }}
      >
        {isOpen ? 'OPEN EYE' : 'BLIND MODE'}
      </span>
    </motion.button>
  );
}
