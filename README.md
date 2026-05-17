# 🔐 Password Hunter

> **Educational cyberpunk brute-force simulator** — demonstrates why strong passwords matter.
> ⚠️ For educational purposes only.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Animations | Framer Motion, Canvas API |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB + Mongoose |
| Cache | Redis |
| PWA | next-pwa (installable on mobile) |
| State | Zustand |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your MongoDB and Redis URLs
```

### 3. Start MongoDB & Redis (local)
```bash
# MongoDB
mongod --dbpath ./data

# Redis
redis-server
```

### 4. Run development server
```bash
npm run dev
# Open http://localhost:3002
```

### 5. Build for production
```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/password_hunter` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT tokens | — |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3002` |

> **Note:** The app works without MongoDB/Redis — it gracefully falls back (history won't persist, caching disabled).

---

## Project Structure

```
password-hunter/
├── app/
│   ├── api/
│   │   ├── history/
│   │   │   ├── route.ts          # GET/POST history
│   │   │   └── [id]/route.ts     # DELETE single/all
│   │   └── analysis/
│   │       └── route.ts          # Password analysis endpoint
│   ├── globals.css               # Cyberpunk styles
│   ├── layout.tsx                # Root layout + PWA meta
│   └── page.tsx                  # Main app page
│
├── components/
│   ├── effects/
│   │   ├── BootScreen.tsx        # CRT boot sequence
│   │   └── ParticleCanvas.tsx    # Animated particle background
│   ├── simulation/
│   │   ├── TerminalConsole.tsx   # Live terminal log
│   │   └── StrengthPanel.tsx     # Password strength analysis
│   ├── panels/
│   │   ├── SettingsPanel.tsx     # Settings modal
│   │   └── HistoryPanel.tsx      # History modal
│   └── ui/
│       └── CyberUI.tsx           # Reusable cyberpunk components
│
├── hooks/
│   ├── useSimulation.ts          # Core simulation engine
│   ├── useSound.ts               # Web Audio API sounds
│   └── usePWA.ts                 # PWA install prompt
│
├── lib/
│   ├── mongodb.ts                # MongoDB connection + models
│   ├── redis.ts                  # Redis client with fallback
│   └── passwordAnalyzer.ts      # Entropy + strength analysis
│
├── stores/
│   └── useAppStore.ts            # Zustand global state
│
├── types/
│   └── index.ts                  # TypeScript types
│
└── public/
    ├── manifest.json             # PWA manifest
    └── icons/                    # App icons
```

---

## Features

- **CRT Boot Sequence** — Cinematic startup with typewriter terminal logs
- **Particle Background** — 60fps Canvas-based animated cyberpunk particles
- **Live Simulation** — Real-time brute-force with terminal console, progress, stats
- **Password Analysis** — Entropy calculation, crack time estimates, strength scoring
- **History System** — MongoDB-backed simulation records with search & filter
- **Redis Caching** — Fast API responses with cache invalidation
- **PWA Support** — Installable on Android/iOS, offline capable
- **Settings** — Theme, speed, charset mode, sound, animation intensity
- **Sound Design** — Web Audio API cyberpunk sound effects

---

## PWA / Mobile Installation

1. Open the site in Chrome on Android
2. Click the **"📲 Install App"** button (appears automatically)
3. Or use Chrome menu → "Add to Home Screen"

The app runs in standalone fullscreen mode like a native app.

---

## Disclaimer

This application is **purely educational**. It simulates brute-force concepts
to illustrate why password strength matters. It cannot attack, access, or affect
any external system. Using password cracking techniques against systems you do
not own is **illegal and unethical**.
# password-hunter
