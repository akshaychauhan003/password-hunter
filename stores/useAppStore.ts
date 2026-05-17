import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ThemeName, SimSpeed, CharsetMode } from '@/types';
import { applyThemeVars, DEFAULT_THEME } from '@/lib/theme';

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
  theme: DEFAULT_THEME,
  soundEnabled: true,
  volume: 40,
  animationIntensity: 70,
  particlesEnabled: true,
  simSpeed: 'normal',
  charsetMode: 'full',
  customCharset: 'abc123!@#',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => {
        applyThemeVars(theme);
        set({ theme });
      },
      setSoundEnabled:       (soundEnabled)        => set({ soundEnabled }),
      setVolume:             (volume)              => set({ volume }),
      setAnimationIntensity: (animationIntensity)  => set({ animationIntensity }),
      setParticlesEnabled:   (particlesEnabled)    => set({ particlesEnabled }),
      setSimSpeed:           (simSpeed)            => set({ simSpeed }),
      setCharsetMode:        (charsetMode)         => set({ charsetMode }),
      setCustomCharset:      (customCharset)       => set({ customCharset }),
      resetDefaults:         () => {
        applyThemeVars(DEFAULT_THEME);
        set(defaults);
      },
    }),
    {
      name: 'password-hunter-settings',
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        volume: state.volume,
        animationIntensity: state.animationIntensity,
        particlesEnabled: state.particlesEnabled,
        simSpeed: state.simSpeed,
        charsetMode: state.charsetMode,
        customCharset: state.customCharset,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeVars(state.theme);
      },
    }
  )
);
