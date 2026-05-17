import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/effects/ThemeProvider';
import { buildThemeInitScript, DEFAULT_THEME, THEME_VARS } from '@/lib/theme';

const defaultBg = THEME_VARS[DEFAULT_THEME]['--theme-bg'];

export const metadata: Metadata = {
  title: 'Password Hunter — Cyber Security Simulator',
  description: 'Educational cyberpunk brute-force simulator for understanding password security and strength.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Password Hunter' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  keywords: ['password security', 'password strength', 'cybersecurity education', 'brute force demo'],
};

export const viewport: Viewport = {
  themeColor: defaultBg,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme={DEFAULT_THEME}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content={defaultBg} />
        <script dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }} />
      </head>
      <body className="crt min-h-screen antialiased" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
        <ThemeProvider />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--theme-bg-card)',
              color: 'var(--theme-primary)',
              border: '1px solid var(--theme-border)',
              fontFamily: 'monospace',
              fontSize: '13px',
            },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
