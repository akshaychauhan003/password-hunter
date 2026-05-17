import type { ThemeName } from '@/types';

/** localStorage key — must match zustand persist `name` in useAppStore */
export const SETTINGS_STORAGE_KEY = 'password-hunter-settings';

export const DEFAULT_THEME: ThemeName = 'hacker-green';

/** Human-readable labels (website + Android parity) */
export const THEME_LABELS: Record<ThemeName, string> = {
  'hacker-green': 'HACKER GREEN',
  'cyber-blue':   'CYBER BLUE',
  'neon-purple':  'NEON PURPLE',
  'red-matrix':   'RED MATRIX',
};

export const THEME_IDS = Object.keys(THEME_LABELS) as ThemeName[];

export const THEME_VARS: Record<ThemeName, Record<string, string>> = {
  'hacker-green': {
    '--theme-primary':        '#00FF41',
    '--theme-primary-dim':    '#00FF4160',
    '--theme-primary-faint':  '#00FF4115',
    '--theme-primary-muted':  '#00FF4180',
    '--theme-secondary':      '#00FFFF',
    '--theme-secondary-dim':  '#00FFFF60',
    '--theme-accent':         '#FFBB00',
    '--theme-danger':         '#FF2020',
    '--theme-bg':             '#050A0E',
    '--theme-bg-card':        '#0D1117',
    '--theme-bg-terminal':    '#080D10',
    '--theme-bg-boot':        '#000000',
    '--theme-text':           '#00FF41',
    '--theme-text-muted':     '#ffffff66',
    '--theme-glow':           '0 0 8px #00FF41, 0 0 20px #00FF4180',
    '--theme-glow-btn':       '0 0 5px #00FF41, 0 0 15px #00FF4150',
    '--theme-shadow-card':    'inset 0 1px 0 0 #00FF4120, 0 0 0 1px #00FF4130',
    '--theme-border':         '#00FF4130',
    '--theme-border-active':  '#00FF41',
    '--theme-card-border':    'rgba(0,255,65,0.2)',
    '--theme-scanline':       '#00FF4108',
    '--theme-particle-1':     '0,255,65',
    '--theme-particle-2':     '0,255,255',
  },
  'cyber-blue': {
    '--theme-primary':        '#0080FF',
    '--theme-primary-dim':    '#0080FF60',
    '--theme-primary-faint':  '#0080FF15',
    '--theme-primary-muted':  '#0080FF80',
    '--theme-secondary':      '#00FFFF',
    '--theme-secondary-dim':  '#00FFFF60',
    '--theme-accent':         '#FFBB00',
    '--theme-danger':         '#FF4040',
    '--theme-bg':             '#030810',
    '--theme-bg-card':        '#0A1220',
    '--theme-bg-terminal':    '#060C18',
    '--theme-bg-boot':        '#000000',
    '--theme-text':           '#0080FF',
    '--theme-text-muted':     '#ffffff66',
    '--theme-glow':           '0 0 8px #0080FF, 0 0 20px #0080FF80',
    '--theme-glow-btn':       '0 0 5px #0080FF, 0 0 15px #0080FF50',
    '--theme-shadow-card':    'inset 0 1px 0 0 #0080FF20, 0 0 0 1px #0080FF30',
    '--theme-border':         '#0080FF30',
    '--theme-border-active':  '#0080FF',
    '--theme-card-border':    'rgba(0,128,255,0.2)',
    '--theme-scanline':       '#0080FF08',
    '--theme-particle-1':     '0,128,255',
    '--theme-particle-2':     '0,255,255',
  },
  'neon-purple': {
    '--theme-primary':        '#B44FFF',
    '--theme-primary-dim':    '#B44FFF60',
    '--theme-primary-faint':  '#B44FFF15',
    '--theme-primary-muted':  '#B44FFF80',
    '--theme-secondary':      '#FF44FF',
    '--theme-secondary-dim':  '#FF44FF60',
    '--theme-accent':         '#FFBB00',
    '--theme-danger':         '#FF2060',
    '--theme-bg':             '#080510',
    '--theme-bg-card':        '#120A1E',
    '--theme-bg-terminal':    '#0A0614',
    '--theme-bg-boot':        '#000000',
    '--theme-text':           '#B44FFF',
    '--theme-text-muted':     '#ffffff66',
    '--theme-glow':           '0 0 8px #B44FFF, 0 0 20px #B44FFF80',
    '--theme-glow-btn':       '0 0 5px #B44FFF, 0 0 15px #B44FFF50',
    '--theme-shadow-card':    'inset 0 1px 0 0 #B44FFF20, 0 0 0 1px #B44FFF30',
    '--theme-border':         '#B44FFF30',
    '--theme-border-active':  '#B44FFF',
    '--theme-card-border':    'rgba(180,79,255,0.2)',
    '--theme-scanline':       '#B44FFF08',
    '--theme-particle-1':     '180,79,255',
    '--theme-particle-2':     '255,68,255',
  },
  'red-matrix': {
    '--theme-primary':        '#FF2020',
    '--theme-primary-dim':    '#FF202060',
    '--theme-primary-faint':  '#FF202015',
    '--theme-primary-muted':  '#FF202080',
    '--theme-secondary':      '#FFBB00',
    '--theme-secondary-dim':  '#FFBB0060',
    '--theme-accent':         '#00FF41',
    '--theme-danger':         '#FF0000',
    '--theme-bg':             '#0A0303',
    '--theme-bg-card':        '#140808',
    '--theme-bg-terminal':    '#0C0505',
    '--theme-bg-boot':        '#000000',
    '--theme-text':           '#FF2020',
    '--theme-text-muted':     '#ffffff66',
    '--theme-glow':           '0 0 8px #FF2020, 0 0 20px #FF202080',
    '--theme-glow-btn':       '0 0 5px #FF2020, 0 0 15px #FF202050',
    '--theme-shadow-card':    'inset 0 1px 0 0 #FF202020, 0 0 0 1px #FF202030',
    '--theme-border':         '#FF202030',
    '--theme-border-active':  '#FF2020',
    '--theme-card-border':    'rgba(255,32,32,0.2)',
    '--theme-scanline':       '#FF202008',
    '--theme-particle-1':     '255,32,32',
    '--theme-particle-2':     '255,187,0',
  },
};

export function isValidThemeName(value: string): value is ThemeName {
  return value in THEME_VARS;
}

/** Read persisted theme from localStorage (client-only). */
export function getPersistedTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as { state?: { theme?: string } };
    const theme = parsed?.state?.theme;
    if (theme && isValidThemeName(theme)) return theme;
  } catch { /* ignore corrupt storage */ }
  return DEFAULT_THEME;
}

export function applyThemeVars(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  const vars = THEME_VARS[theme] || THEME_VARS[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
  root.dataset.theme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', vars['--theme-bg'] || '#050A0E');
}

/** Inline script injected in layout <head> — runs before React hydration. */
export function buildThemeInitScript(): string {
  return `
(function(){
  var KEY=${JSON.stringify(SETTINGS_STORAGE_KEY)};
  var vars=${JSON.stringify(THEME_VARS)};
  var def=${JSON.stringify(DEFAULT_THEME)};
  var theme=def;
  try{
    var raw=localStorage.getItem(KEY);
    if(raw){
      var parsed=JSON.parse(raw);
      var t=parsed&&parsed.state&&parsed.state.theme;
      if(t&&vars[t])theme=t;
    }
  }catch(e){}
  var v=vars[theme]||vars[def];
  var r=document.documentElement;
  for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k))r.style.setProperty(k,v[k]);
  r.dataset.theme=theme;
  r.style.colorScheme='dark';
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta&&v['--theme-bg'])meta.setAttribute('content',v['--theme-bg']);
})();
`.trim();
}
