import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

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
  themeColor: '#050A0E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="crt min-h-screen bg-bg-dark antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0D1117',
              color: '#00FF41',
              border: '1px solid #00FF4140',
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
