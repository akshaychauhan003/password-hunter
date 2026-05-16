import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ThemeName, SimSpeed, CharsetMode } from '@/types';

interface AppStore extends AppSettings {
  setTheme: (t: ThemeName) => void;
  setSoundEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  setAnimationIntensity: (v: number) => void;
  setParticlesEnabled: (v: boolean) => void;
  setSimSpeed: (s: SimSpeed) => void;
  setCharsetMode: (m: CharsetMode) => void;
  setCustomCharset: (cs: string) => void;
  resetDefaults: () => void;
}

const defaults: AppSettings = {
  theme: 'hacker-green',
  soundEnabled: true,
  volume: 40,
  animationIntensity: 70,
  particlesEnabled: true,
  simSpeed: 'normal',
  charsetMode: 'alphanumeric',
  customCharset: 'abc123!@#',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme:              (theme)              => set({ theme }),
      setSoundEnabled:       (soundEnabled)        => set({ soundEnabled }),
      setVolume:             (volume)              => set({ volume }),
      setAnimationIntensity: (animationIntensity)  => set({ animationIntensity }),
      setParticlesEnabled:   (particlesEnabled)    => set({ particlesEnabled }),
      setSimSpeed:           (simSpeed)            => set({ simSpeed }),
      setCharsetMode:        (charsetMode)         => set({ charsetMode }),
      setCustomCharset:      (customCharset)       => set({ customCharset }),
      resetDefaults:         ()                    => set(defaults),
    }),
    { name: 'password-hunter-settings' }
  )
);
