'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

// ── CyberButton ───────────────────────────────────────────────

type BtnVariant = 'green' | 'cyan' | 'red' | 'purple' | 'ghost';

interface CyberButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const variantClasses: Record<BtnVariant, string> = {
  green:  'border-neon-green/40 text-neon-green hover:border-neon-green hover:bg-neon-green/10 btn-neon-green',
  cyan:   'border-neon-cyan/40  text-neon-cyan  hover:border-neon-cyan  hover:bg-neon-cyan/10  btn-neon-cyan',
  red:    'border-neon-red/40   text-neon-red   hover:border-neon-red   hover:bg-neon-red/10   btn-neon-red',
  purple: 'border-neon-purple/40 text-neon-purple hover:border-neon-purple hover:bg-neon-purple/10',
  ghost:  'border-white/10 text-white/60 hover:border-white/30 hover:text-white/90',
};

const sizeClasses = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };

export function CyberButton({ variant = 'green', size = 'md', glow, className, children, ...props }: CyberButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        'relative font-mono font-bold tracking-wider uppercase border rounded-lg',
        'transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ── CyberInput ────────────────────────────────────────────────

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  glowColor?: string;
}

export function CyberInput({ label, hint, error, glowColor = '#00FF41', className, ...props }: CyberInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-mono text-neon-cyan/80 tracking-widest uppercase mb-2">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full bg-bg-terminal border rounded-lg px-4 py-3',
          'font-mono text-neon-green text-base placeholder:text-white/20',
          'border-neon-green/30 focus:border-neon-green focus:outline-none',
          'transition-all duration-200',
          'focus:shadow-[0_0_0_1px_#00FF41,0_0_20px_#00FF4130]',
          error ? 'border-neon-red' : '',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs font-mono text-white/30">{hint}</p>}
      {error && <p className="mt-1 text-xs font-mono text-neon-red">{error}</p>}
    </div>
  );
}

// ── CyberCard ─────────────────────────────────────────────────

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  title?: string;
  titleColor?: string;
}

export function CyberCard({ children, className, animate = true, title, titleColor = 'text-neon-cyan' }: CyberCardProps) {
  const content = (
    <div className={clsx('glass-card rounded-xl p-5 border-animate', className)}>
      {title && (
        <p className={clsx('text-xs font-mono tracking-widest uppercase mb-4', titleColor)}>
          ▸ {title}
        </p>
      )}
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}

// ── StatBadge ─────────────────────────────────────────────────

export function StatBadge({ label, value, color = 'text-neon-green' }: {
  label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">{label}</span>
      <span className={clsx('text-sm font-mono font-bold', color)}>{value}</span>
    </div>
  );
}
