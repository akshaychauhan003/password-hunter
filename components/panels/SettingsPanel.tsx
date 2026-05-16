'use client';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { CyberButton } from '@/components/ui/CyberUI';
import type { ThemeName, SimSpeed, CharsetMode } from '@/types';

interface Props { onClose: () => void; }

export default function SettingsPanel({ onClose }: Props) {
  const store = useAppStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto terminal-scroll">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-neon-green font-mono font-bold tracking-widest text-sm">⚙ SYSTEM SETTINGS</h2>
          <CyberButton variant="ghost" size="sm" onClick={onClose}>✕</CyberButton>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="text-[10px] font-mono text-neon-cyan/60 tracking-widest uppercase mb-2 block">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {(['hacker-green','cyber-blue','neon-purple','red-matrix'] as ThemeName[]).map(t => (
                <button key={t} onClick={() => store.setTheme(t)}
                  className={`py-2 px-3 rounded-lg border font-mono text-xs tracking-wider transition-all ${store.theme === t ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}>
                  {t.replace('-',' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Charset mode */}
          <div>
            <label className="text-[10px] font-mono text-neon-cyan/60 tracking-widest uppercase mb-2 block">Brute-Force Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['alpha','numeric','alphanumeric','full','custom'] as CharsetMode[]).map(m => (
                <button key={m} onClick={() => store.setCharsetMode(m)}
                  className={`py-2 px-3 rounded-lg border font-mono text-xs tracking-wider transition-all ${store.charsetMode === m ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            {store.charsetMode === 'custom' && (
              <input value={store.customCharset} onChange={e => store.setCustomCharset(e.target.value)}
                placeholder="Custom chars e.g. abc123!@#"
                className="mt-2 w-full bg-bg-terminal border border-neon-green/30 rounded-lg px-3 py-2 text-neon-green font-mono text-sm focus:outline-none focus:border-neon-green" />
            )}
          </div>

          {/* Speed */}
          <div>
            <label className="text-[10px] font-mono text-neon-cyan/60 tracking-widest uppercase mb-2 block">Simulation Speed</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['slow','normal','fast','instant'] as SimSpeed[]).map(s => (
                <button key={s} onClick={() => store.setSimSpeed(s)}
                  className={`py-2 rounded-lg border font-mono text-[10px] tracking-wider transition-all ${store.simSpeed === s ? 'border-neon-amber text-neon-amber bg-neon-amber/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div>
            <label className="text-[10px] font-mono text-neon-cyan/60 tracking-widest uppercase mb-2 block">Sound</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-white/60">Sound Effects</span>
              <button onClick={() => store.setSoundEnabled(!store.soundEnabled)}
                className={`w-12 h-6 rounded-full border transition-all relative ${store.soundEnabled ? 'bg-neon-green/20 border-neon-green' : 'bg-white/5 border-white/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${store.soundEnabled ? 'left-6 bg-neon-green' : 'left-0.5 bg-white/30'}`} />
              </button>
            </div>
            {store.soundEnabled && (
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-mono text-white/40">Volume</span>
                  <span className="text-xs font-mono text-neon-green">{store.volume}%</span>
                </div>
                <input type="range" min="0" max="100" value={store.volume}
                  onChange={e => store.setVolume(Number(e.target.value))}
                  className="w-full accent-neon-green" />
              </div>
            )}
          </div>

          {/* Particles */}
          <div>
            <label className="text-[10px] font-mono text-neon-cyan/60 tracking-widest uppercase mb-2 block">Visual Effects</label>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-mono text-white/60">Particle Background</span>
              <button onClick={() => store.setParticlesEnabled(!store.particlesEnabled)}
                className={`w-12 h-6 rounded-full border transition-all relative ${store.particlesEnabled ? 'bg-neon-green/20 border-neon-green' : 'bg-white/5 border-white/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${store.particlesEnabled ? 'left-6 bg-neon-green' : 'left-0.5 bg-white/30'}`} />
              </button>
            </div>
            {store.particlesEnabled && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-mono text-white/40">Intensity</span>
                  <span className="text-xs font-mono text-neon-cyan">{store.animationIntensity}%</span>
                </div>
                <input type="range" min="10" max="100" value={store.animationIntensity}
                  onChange={e => store.setAnimationIntensity(Number(e.target.value))}
                  className="w-full accent-neon-cyan" />
              </div>
            )}
          </div>

          {/* Reset */}
          <CyberButton variant="ghost" size="sm" className="w-full" onClick={store.resetDefaults}>
            ↺ Reset All Defaults
          </CyberButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
