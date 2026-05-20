'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/hooks/useSimulation';
import { useAppStore } from '@/stores/useAppStore';
import { usePWA } from '@/hooks/usePWA';
import { useMobile, useApkAvailable } from '@/hooks/useMobile';
import { useSound } from '@/hooks/useSound';
import { CyberButton, CyberInput, CyberCard, StatBadge } from '@/components/ui/CyberUI';
import TerminalConsole from '@/components/simulation/TerminalConsole';
import AttemptStream from '@/components/simulation/AttemptStream';
import StrengthPanel from '@/components/simulation/StrengthPanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import HistoryPanel from '@/components/panels/HistoryPanel';
import BootScreen from '@/components/effects/BootScreen';
import EyeToggle from '@/components/effects/EyeToggle';
import { useDiscoveryMode } from '@/hooks/useDiscoveryMode';

const ParticleCanvas = dynamic(() => import('@/components/effects/ParticleCanvas'), { ssr: false });

const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
function genRandom(len = 10) {
  return Array.from({ length: len }, () => RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]).join('');
}

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtMs(ms: number) {
  if (ms < 1000) return ms + 'ms';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}.${String(ms % 1000).padStart(3, '0').slice(0, 2)}s`;
}

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [password, setPassword] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [apkDownloading, setApkDownloading] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  // Incremented after simulation completes so HistoryPanel re-fetches
  const [historyKey, setHistoryKey] = useState(0);

  const { state, logs, attemptLines, start, pause, resume, stop, reset } = useSimulation();
  const { charsetMode, simSpeed, customCharset } = useAppStore();
  const { mode: discoveryMode, toggle: toggleEye, isEyeOpen } = useDiscoveryMode();
  const { isInstallable, install } = usePWA();
  const isMobile = useMobile();
  const apkAvailable = useApkAvailable();
  const sound = useSound();

  const APK_PATH = '/downloads/password-hunter.apk';

  const TITLE = 'PASSWORD HUNTER';

  // Typewriter
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

  // When simulation completes → bump historyKey so panel auto-refreshes
  useEffect(() => {
    if (state.isComplete && state.found) {
      setHistoryKey(k => k + 1);
    }
  }, [state.isComplete, state.found]);

  // On mobile, surface Android download panel by default
  useEffect(() => {
    if (isMobile) setShowAndroid(true);
  }, [isMobile]);

  const handleStart = () => {
    if (!password) return;
    sound.playClick();
    start(password, charsetMode, simSpeed, customCharset, discoveryMode);
  };

  const handleReset = () => {
    sound.playClick();
    reset();
    setPassword('');
  };

  return (
    <>
      <AnimatePresence>{!booted && <BootScreen onComplete={() => setBooted(true)} />}</AnimatePresence>

      {booted && (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
          <ParticleCanvas />
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-20">

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <motion.div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-neon-green/40 flex items-center justify-center text-lg shadow-neon-green"
                  style={{ color: 'var(--theme-primary)', borderColor: 'var(--theme-border)' }}>
                  🔐
                </div>
                <div>
                  <p className="text-[10px] font-mono text-neon-cyan/60 tracking-widest">EDUCATIONAL TOOL</p>
                  <p className="text-xs font-mono text-white/30">Cybersecurity Simulator v2.0</p>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-2 flex-wrap justify-end">
                <EyeToggle
                  isOpen={isEyeOpen}
                  onToggle={toggleEye}
                  disabled={state.isRunning}
                />

                {/* PWA Install */}
                {isInstallable && (
                  <CyberButton variant="cyan" size="sm" onClick={() => { sound.playClick(); install(); }}>
                    📲 Install PWA
                  </CyberButton>
                )}

                {/* Android app panel (download remains separate from PWA install) */}
                <CyberButton variant="ghost" size="sm"
                  onClick={() => { sound.playClick(); setShowAndroid(v => !v); }}
                  title="Android app availability"
                  className={showAndroid ? 'btn-theme-active' : ''}>
                  <span className="inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                    </svg>
                    Android
                  </span>
                </CyberButton>

                <CyberButton variant="ghost" size="sm" onClick={() => { sound.playClick(); setShowHistory(true); }}>
                  ☰ History
                </CyberButton>
                <CyberButton variant="ghost" size="sm" onClick={() => { sound.playClick(); setShowSettings(true); }}>
                  ⚙
                </CyberButton>
              </motion.div>
            </motion.div>

            {/* ── Android APK download panel ── */}
            <AnimatePresence>
              {showAndroid && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden">
                  <motion.div className="glass-card rounded-xl p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                          style={{ background: 'var(--theme-primary-faint)', border: '1px solid var(--theme-border)' }}>
                          🤖
                        </div>
                        <div>
                          <p className="font-mono font-bold text-sm theme-primary-text tracking-widest">
                            ANDROID APP
                          </p>
                          <p className="font-mono text-xs theme-muted-text">
                            Native client for mobile · v1.0.0
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowAndroid(false)}
                        className="theme-muted-text hover:opacity-80 text-lg transition-colors p-1 hover:bg-white/5 rounded">
                        ✕
                      </button>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left: Info */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="font-mono text-xs font-semibold theme-muted-text tracking-wide">FEATURES</p>
                          <ul className="font-mono text-xs text-white/60 space-y-1">
                            <li>✓ Direct Spring Boot backend connection</li>
                            <li>✓ Offline mode support</li>
                            <li>✓ Native Android performance</li>
                            {isMobile && <li>✓ Mobile device detected</li>}
                          </ul>
                        </div>

                        {/* Status */}
                        {apkAvailable === null && (
                          <div className="flex items-center gap-2 text-xs font-mono theme-muted-text">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan/50 animate-pulse" />
                            Checking availability…
                          </div>
                        )}
                        
                        {apkAvailable === false && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                            <p className="font-mono text-xs" style={{ color: 'var(--theme-danger)' }}>
                              Android APK is not published right now. The download button stays hidden until a real build exists.
                            </p>
                            <p className="font-mono text-[11px] text-white/50">
                              You can still install the PWA separately when that option is available.
                            </p>
                          </div>
                        )}

                        {apkAvailable === true && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="font-mono text-xs text-green-400/80">
                              ✓ Ready to download
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Download & Warning */}
                      <div className="space-y-3 flex flex-col justify-between">
                        {apkAvailable === true ? (
                          <a
                            href={APK_PATH}
                            download="password-hunter.apk"
                            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border font-mono text-sm font-bold tracking-wider transition-all duration-200 btn-theme ${
                              apkDownloading ? 'opacity-60 pointer-events-none' : 'hover:scale-105'
                            }`}
                            onClick={() => {
                              sound.playClick();
                              setApkDownloading(true);
                              setTimeout(() => setApkDownloading(false), 2000);
                            }}>
                            {apkDownloading ? (
                              <>
                                <span className="inline-block animate-spin">⟳</span> Downloading…
                              </>
                            ) : (
                              <>
                                ⬇ Download APK
                              </>
                            )}
                          </a>
                        ) : (
                          <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                            <p className="font-mono text-xs theme-muted-text">
                              {apkAvailable === null
                                ? 'Checking for a published Android APK...'
                                : 'No downloadable APK is currently available.'}
                            </p>
                          </div>
                        )}

                        {/* Installation Info Card */}
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                          <p className="font-mono text-xs font-semibold text-blue-300 tracking-wide flex items-center gap-2">
                            <span>ℹ️</span> Before Installing
                          </p>
                          <ol className="font-mono text-[11px] text-white/60 space-y-1 ml-2">
                            <li>1. Go to Settings → Apps → Special app access</li>
                            <li>2. Select "Install unknown apps"</li>
                            <li>3. Enable for your browser or file manager</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Footer note */}
                    <div className="pt-2 border-t border-white/5">
                      <p className="font-mono text-[10px] text-white/40">
                        For security reasons, this app is not published on Google Play Store. Install directly from this APK.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Title ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-center mb-10">
              <h1 className="text-4xl md:text-6xl font-mono font-black tracking-widest title-glow mb-3">
                {titleText}
                {!titleDone && <span style={{ opacity: cursorVisible ? 1 : 0 }}>█</span>}
                {titleDone  && <span style={{ opacity: cursorVisible ? 1 : 0, color: 'var(--theme-secondary)' }}>█</span>}
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                className="text-neon-cyan/70 font-mono text-sm tracking-widest">
                CYBER BRUTE-FORCE SIMULATOR — EDUCATIONAL USE ONLY
              </motion.p>
            </motion.div>

            {/* ── Main grid ── */}
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
                      <span className="text-[11px] font-mono text-white/30">
                        Mode: {charsetMode} · Speed: {simSpeed} · Eye: {isEyeOpen ? 'OPEN' : 'BLIND'}
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {!state.isRunning && !state.isComplete && (
                        <CyberButton variant="green" size="md" onClick={handleStart} disabled={!password}>
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
                      <CyberButton variant="ghost" size="md"
                        onClick={() => { sound.playClick(); setPassword(genRandom()); }}>
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
                      <p className="text-2xl md:text-3xl font-mono font-bold break-all whitespace-break-spaces leading-tight theme-primary-text">
                        {state.currentAttempt ? (
                          state.currentAttempt.split('').map((ch, idx) => {
                            const isActive = !state.isComplete && idx === state.activeIndex;
                            const isLocked = state.isComplete || idx < state.activeIndex;
                            const isPlaceholder = ch === '_';
                            const isBlind = state.discoveryMode === 'blind';

                            return (
                              <span
                                key={`${ch}-${idx}`}
                                className={`inline-block transition-all duration-150 ${
                                  isActive
                                    ? 'text-neon-cyan scale-110 drop-shadow-[0_0_8px_var(--theme-secondary)] animate-pulse'
                                    : ''
                                } ${isLocked && !isPlaceholder ? 'text-neon-green' : ''} ${
                                  isPlaceholder ? 'text-white/25' : ''
                                } ${isBlind && isActive ? 'matrix-flicker' : ''}`}>
                                {ch}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-white/30">
                            {state.isComplete
                              ? (state.discoveredPassword || state.target || '—')
                              : state.discoveryMode === 'blind'
                                ? '— blind scan pending —'
                                : '—'}
                          </span>
                        )}
                      </p>
                      <span className="text-2xl animate-blink" style={{ color: 'var(--theme-primary)' }}>█</span>
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
                      <StatBadge label="Speed" value={state.attemptsPerSecond > 0 ? fmt(state.attemptsPerSecond) + '/s' : '—'} color="text-neon-cyan" />
                      <StatBadge label="Elapsed" value={state.elapsedMs > 0 ? fmtMs(state.elapsedMs) : '—'} color="text-neon-amber" />
                      <StatBadge label="Progress" value={`${(state.progress * 100).toFixed(1)}%`} color="text-neon-purple" />
                    </div>

                    {/* Result banner */}
                    {state.isComplete && state.found && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 rounded-lg bg-neon-green/10 border border-neon-green/40 text-center"
                        style={{ borderColor: 'var(--theme-border-active)', background: 'var(--theme-primary-faint)' }}>
                        <p className="font-mono font-bold text-lg theme-primary-text">✅ PASSWORD CRACKED</p>
                        <p className="text-neon-cyan font-mono text-xl font-black mt-1">
                          "{state.discoveredPassword || state.target}"
                        </p>
                        <p className="text-[10px] font-mono theme-muted-text mt-1">
                          {state.discoveryMode === 'blind' ? '👁 Blind discovery — reconstructed via validation only' : '👁 Open eye — direct visibility'}
                        </p>
                        <div className="flex justify-center gap-6 mt-3">
                          <StatBadge label="Attempts" value={fmt(state.attemptCount)} />
                          <StatBadge label="Time"     value={fmtMs(state.elapsedMs)} color="text-neon-amber" />
                        </div>
                      </motion.div>
                    )}
                  </CyberCard>
                </motion.div>

                {/* Live attempt stream (blind) + system terminal */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-4">
                  {(state.discoveryMode === 'blind' || attemptLines.length > 0) && (
                    <AttemptStream
                      lines={attemptLines}
                      isRunning={state.isRunning}
                      isComplete={state.isComplete && state.found}
                    />
                  )}
                  <TerminalConsole logs={logs} />
                </motion.div>
              </div>

              {/* Right panel */}
              <div className="space-y-5">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <CyberCard title="Strength Analysis" animate={false} titleColor="text-neon-amber">
                    <StrengthPanel password={password} />
                  </CyberCard>
                </motion.div>

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

          {/* ── Sliding panels ── */}
          <AnimatePresence>
            {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
            {showHistory && (
              <HistoryPanel
                onClose={() => setShowHistory(false)}
                refreshTrigger={historyKey}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
