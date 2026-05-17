'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; maxRadius: number;
  alpha: number; alphaDecay: number;
  growSpeed: number;
  color: [number, number, number];
  glowSize: number;
  type: 'circle' | 'dot' | 'spark';
  shrinking: boolean;
  life: number;
}

function getThemeParticleColors(): [number, number, number][] {
  if (typeof window === 'undefined') return [[0, 255, 65], [0, 255, 255]];
  const style = getComputedStyle(document.documentElement);
  const p1 = (style.getPropertyValue('--theme-particle-1') || '0,255,65').split(',').map(Number) as [number, number, number];
  const p2 = (style.getPropertyValue('--theme-particle-2') || '0,255,255').split(',').map(Number) as [number, number, number];
  const primary = (style.getPropertyValue('--theme-primary') || '#00FF41').replace('#', '');
  const r = parseInt(primary.slice(0, 2), 16) || 0;
  const g = parseInt(primary.slice(2, 4), 16) || 255;
  const b = parseInt(primary.slice(4, 6), 16) || 65;
  return [p1, p2, [r, g, b]];
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const pool      = useRef<Particle[]>([]);
  const bootFrame = useRef(0);
  const { particlesEnabled, animationIntensity, theme } = useAppStore();

  useEffect(() => {
    if (!particlesEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Pre-fill pool
    for (let i = 0; i < 80; i++) pool.current.push({} as Particle);

    const spawn = () => {
      const p: Particle = pool.current.pop() ?? ({} as Particle);
      const W = canvas.width, H = canvas.height;
      const typeRoll = Math.random();
      p.type       = typeRoll < 0.5 ? 'circle' : typeRoll < 0.8 ? 'dot' : 'spark';
      p.x          = Math.random() * W;
      p.y          = Math.random() * H;
      const colors = getThemeParticleColors();
      p.color      = colors[Math.floor(Math.random() * colors.length)];
      p.life       = 0;
      p.shrinking  = false;

      if (p.type === 'circle') {
        p.maxRadius  = 8 + Math.random() * 55;
        p.growSpeed  = 0.15 + Math.random() * 1.2;
        p.alpha      = 0.25 + Math.random() * 0.5;
        p.alphaDecay = 0.002 + Math.random() * 0.006;
        p.glowSize   = 1.5 + Math.random() * 2.5;
        p.vx         = (Math.random() - 0.5) * 0.3;
        p.vy         = (Math.random() - 0.5) * 0.3;
      } else if (p.type === 'spark') {
        p.maxRadius  = 1.5 + Math.random() * 3;
        p.growSpeed  = 0.4 + Math.random() * 0.8;
        p.alpha      = 0.7 + Math.random() * 0.3;
        p.alphaDecay = 0.012 + Math.random() * 0.018;
        p.glowSize   = 1;
        const ang    = Math.random() * Math.PI * 2;
        const spd    = 0.4 + Math.random() * 1.8;
        p.vx         = Math.cos(ang) * spd;
        p.vy         = Math.sin(ang) * spd;
      } else {
        p.maxRadius  = 2 + Math.random() * 3.5;
        p.growSpeed  = 0.6;
        p.alpha      = 0.4 + Math.random() * 0.5;
        p.alphaDecay = 0.003 + Math.random() * 0.005;
        p.glowSize   = 1.2;
        p.vx         = 0;
        p.vy         = 0.2 + Math.random() * 0.7;
      }
      p.radius = 0;
      particles.current.push(p);
    };

    const maxActive = Math.round((animationIntensity / 100) * 50) + 10;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      bootFrame.current = Math.min(bootFrame.current + 1, 120);
      const bootRatio = bootFrame.current / 120;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      const spawnRate = Math.ceil(bootRatio * 2 * (animationIntensity / 100));
      for (let i = 0; i < spawnRate && particles.current.length < maxActive; i++) spawn();

      // Update + draw
      particles.current = particles.current.filter(p => {
        // Move
        p.x += p.vx * dt; p.y += p.vy * dt;
        // Grow / shrink
        if (!p.shrinking) {
          p.radius += p.growSpeed * dt;
          if (p.radius >= p.maxRadius) { p.radius = p.maxRadius; if (p.type === 'circle') p.shrinking = true; }
        } else {
          p.radius = Math.max(0, p.radius - p.growSpeed * 0.5 * dt);
        }
        p.alpha = Math.max(0, p.alpha - p.alphaDecay * dt);
        p.life += p.alphaDecay * dt;
        if (p.life >= 1 || p.radius <= 0) { pool.current.push(p); return false; }
        if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100) {
          pool.current.push(p); return false;
        }

        const [r, g, b] = p.color;
        const a = p.alpha;
        if (p.type === 'circle') {
          // Outer glow
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * p.glowSize);
          grad.addColorStop(0,   `rgba(${r},${g},${b},${a * 0.6})`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},${a * 0.4})`);
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * p.glowSize, 0, Math.PI * 2);
          ctx.fillStyle = grad; ctx.fill();
          // Core
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(a + 0.3, 1)})`; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.shadowColor = `rgba(${r},${g},${b},${a})`; ctx.shadowBlur = p.radius * 4;
          ctx.fill(); ctx.shadowBlur = 0;
        }
        return true;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      particles.current = [];
    };
  }, [particlesEnabled, animationIntensity, theme]);

  if (!particlesEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
