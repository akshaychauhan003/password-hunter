'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/hooks/useSimulation';
import { useAppStore } from '@/stores/useAppStore';
import { usePWA } from '@/hooks/usePWA';
import { useSound } from '@/hooks/useSound';
import { analysePassword } from '@/lib/passwordAnalyzer';
import { CyberButton, CyberInput, CyberCard, StatBadge } from '@/components/ui/CyberUI';
import TerminalConsole from '@/components/simulation/TerminalConsole';
import StrengthPanel from '@/components/simulation/StrengthPanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import HistoryPanel from '@/components/panels/HistoryPanel';
import BootScreen from '@/components/effects/BootScreen';

const ParticleCanvas = dynamic(() => import('@/components/effects/ParticleCanvas'), { ssr: false });

const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

function genRandom(len = 10) {
  return Array.from({ length: len }, () => RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]).join('');
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtMs(ms: number) {
  if (ms < 1000) return ms + 'ms';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}.${String(ms % 1000).padStart(3,'0').slice(0,2)}s`;
}

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [password, setPassword] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const { state, logs, start, pause, resume, stop, reset } = useSimulation();
  const { charsetMode, simSpeed, customCharset } = useAppStore();
  const { isInstallable, install } = usePWA();
  const sound = useSound();

  const TITLE = 'PASSWORD HUNTER';

  // Typewriter effect for title
  useEffect(() => {
    if (!booted) return;
    let i = 0;
    const t = setInterval(() => {
      setTitleText(TITLE.slice(0, ++i));
      sound.playTypingTick();
      if (i >= TITLE.length) { clearInterval(t); setTitleDone(true); }
    }, 80);
    return () => clearInterval(t);
  }, [booted]); // eslint-disable-line

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  const handleStart = () => {
    if (!password.trim()) return;
    sound.playClick();
    start(password.trim(), charsetMode, simSpeed, customCharset);
  };

  const handleReset = () => {
    sound.playClick();
    reset();
    setPassword('');
  };

  const diffColor = (d: string) => ({
    Easy: 'text-neon-green', Medium: 'text-neon-amber', Hard: 'text-orange-400',
    Extreme: 'text-neon-red', Impossible: 'text-neon-purple',
  }[d] ?? 'text-white/60');

  return (
    <>
      <AnimatePresence>{!booted && <BootScreen onComplete={() => setBooted(true)} />}</AnimatePresence>

      {booted && (
        <div className="relative min-h-screen bg-bg-dark text-neon-green overflow-x-hidden">
          <ParticleCanvas />
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-20">

            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-neon-green/40 flex items-center justify-center text-neon-green text-lg shadow-neon-green">
                  🔐
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neon-cyan/60 tracking-widest">EDUCATIONAL TOOL</p>
                  <p className="text-xs font-mono text-white/30">Cybersecurity Simulator v1.0</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isInstallable && (
                  <CyberButton variant="cyan" size="sm" onClick={() => { sound.playClick(); install(); }}>
                    📲 Install App
                  </CyberButton>
                )}
                <CyberButton variant="ghost" size="sm" onClick={() => { sound.playClick(); setShowHistory(true); }}>
                  ☰ History
                </CyberButton>
                <CyberButton variant="ghost" size="sm" onClick={() => { sound.playClick(); setShowSettings(true); }}>
                  ⚙
                </CyberButton>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-center mb-10">
              <h1 className="text-4xl md:text-6xl font-mono font-black tracking-widest text-glow-green mb-3">
                {titleText}{!titleDone && <span style={{ opacity: cursorVisible ? 1 : 0 }}>█</span>}
                {titleDone && <span style={{ opacity: cursorVisible ? 1 : 0 }} className="text-neon-cyan">█</span>}
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                className="text-neon-cyan/70 font-mono text-sm tracking-widest">
                CYBER BRUTE-FORCE SIMULATOR — EDUCATIONAL USE ONLY
              </motion.p>
            </motion.div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: input + controls */}
              <div className="lg:col-span-2 space-y-5">

                {/* Input card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <CyberCard title="Target Input" animate={false}>
                    <CyberInput
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !state.isRunning && handleStart()}
                      placeholder="Enter target password or text…"
                      disabled={state.isRunning}
                      maxLength={50}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[11px] font-mono text-white/30">{password.length} characters</span>
                      <span className="text-[11px] font-mono text-white/30">Mode: {charsetMode} · Speed: {simSpeed}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {!state.isRunning && !state.isComplete && (
                        <CyberButton variant="green" size="md" onClick={handleStart} disabled={!password.trim()}>
                          ▶ Start Simulation
                        </CyberButton>
                      )}
                      {state.isRunning && !state.isPaused && (
                        <CyberButton variant="cyan" size="md" onClick={() => { sound.playClick(); pause(); }}>
                          ⏸ Pause
                        </CyberButton>
                      )}
                      {state.isRunning && state.isPaused && (
                        <CyberButton variant="green" size="md" onClick={() => { sound.playClick(); resume(); }}>
                          ▶ Resume
                        </CyberButton>
                      )}
                      {state.isRunning && (
                        <CyberButton variant="red" size="md" onClick={() => { sound.playClick(); stop(); }}>
                          ⏹ Stop
                        </CyberButton>
                      )}
                      <CyberButton variant="ghost" size="md" onClick={() => { sound.playClick(); setPassword(genRandom()); }}>
                        ⚡ Random
                      </CyberButton>
                      <CyberButton variant="ghost" size="md" onClick={handleReset}>↺ Reset</CyberButton>
                    </div>
                  </CyberCard>
                </motion.div>

                {/* Current attempt display */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <CyberCard title="Current Attempt" animate={false}>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-2xl md:text-3xl font-mono font-bold text-neon-green break-all leading-tight">
                        {state.currentAttempt || (state.isComplete ? state.target : '—')}
                      </p>
                      <span className="text-neon-green text-2xl animate-blink">█</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="h-full rounded-full progress-neon"
                        animate={{ width: `${(state.progress * 100).toFixed(1)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <StatBadge label="Attempts" value={fmt(state.attemptCount)} color="text-neon-green" />
                      <StatBadge label="Speed" value={state.attemptsPerSecond > 0 ? fmt(state.attemptsPerSecond)+'/s' : '—'} color="text-neon-cyan" />
                      <StatBadge label="Elapsed" value={state.elapsedMs > 0 ? fmtMs(state.elapsedMs) : '—'} color="text-neon-amber" />
                      <StatBadge label="Progress" value={`${(state.progress * 100).toFixed(1)}%`} color="text-neon-purple" />
                    </div>

                    {/* Result banner */}
                    {state.isComplete && state.found && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 rounded-lg bg-neon-green/10 border border-neon-green/40 text-center">
                        <p className="text-neon-green font-mono font-bold text-lg">✅ PASSWORD CRACKED</p>
                        <p className="text-neon-cyan font-mono text-xl font-black mt-1">"{state.target}"</p>
                        <div className="flex justify-center gap-6 mt-3">
                          <StatBadge label="Attempts" value={fmt(state.attemptCount)} />
                          <StatBadge label="Time" value={fmtMs(state.elapsedMs)} color="text-neon-amber" />
                        </div>
                      </motion.div>
                    )}
                  </CyberCard>
                </motion.div>

                {/* Terminal */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <TerminalConsole logs={logs} />
                </motion.div>
              </div>

              {/* Right panel: strength + info */}
              <div className="space-y-5">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <CyberCard title="Strength Analysis" animate={false} titleColor="text-neon-amber">
                    <StrengthPanel password={password} />
                  </CyberCard>
                </motion.div>

                {/* Info card */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                  <CyberCard title="About" animate={false} titleColor="text-white/40">
                    <div className="space-y-2 text-[11px] font-mono text-white/40 leading-relaxed">
                      <p>This tool simulates brute-force attacks to demonstrate why strong passwords matter.</p>
                      <p className="text-neon-red/60">⚠ Educational use only. Never target systems you don't own.</p>
                    </div>
                  </CyberCard>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Panels */}
          <AnimatePresence>
            {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
            {showHistory  && <HistoryPanel  onClose={() => setShowHistory(false)} />}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
