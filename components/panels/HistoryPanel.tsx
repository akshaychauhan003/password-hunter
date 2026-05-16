'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberUI';
import { useSound } from '@/hooks/useSound';
import type { HistoryItem } from '@/types';
import { format } from 'date-fns';

interface Props { onClose: () => void; }

const DIFF_COLORS: Record<string, string> = {
  Easy: 'text-neon-green', Medium: 'text-neon-amber',
  Hard: 'text-orange-400', Extreme: 'text-neon-red', Impossible: 'text-neon-purple',
};

export default function HistoryPanel({ onClose }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sound = useSound();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (filter) params.set('difficulty', filter);
      const res = await fetch(`${apiUrl}/api/history?${params}`);
      const data = await res.json();
      if (data.success) { setItems(data.data?.items || []); setTotal(data.data?.total || 0); }
    } catch { /* offline - show empty */ }
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const deleteItem = async (id: string) => {
    sound.playDelete();
    setDeletingId(id);
    await new Promise(r => setTimeout(r, 350));
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/history/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i._id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch {}
    setDeletingId(null);
  };

  const clearAll = async () => {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    sound.playDelete();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/history/all`, { method: 'DELETE' });
      setItems([]); setTotal(0);
    } catch {}
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    if (m > 0) return `${m}m ${s % 60}s`;
    return s > 0 ? `${s}s` : `${ms}ms`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-neon-green font-mono font-bold tracking-widest text-sm">☰ SIMULATION HISTORY</h2>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">{total} records found</p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <CyberButton variant="red" size="sm" onClick={clearAll}>🗑 Clear All</CyberButton>
            )}
            <CyberButton variant="ghost" size="sm" onClick={onClose}>✕</CyberButton>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search history…"
            className="flex-1 bg-bg-terminal border border-neon-green/20 rounded-lg px-3 py-2 text-neon-green font-mono text-xs focus:outline-none focus:border-neon-green" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-bg-terminal border border-neon-green/20 rounded-lg px-3 py-2 text-neon-green font-mono text-xs focus:outline-none">
            <option value="">All</option>
            {['Easy','Medium','Hard','Extreme','Impossible'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto terminal-scroll space-y-3 pr-1">
          {loading && (
            <div className="text-center py-12 text-white/30 font-mono text-sm animate-pulse">
              Loading history...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-white/30 font-mono text-sm">No records found</p>
              <p className="text-white/20 font-mono text-xs mt-1">Run a simulation to see results here</p>
            </div>
          )}
          <AnimatePresence>
            {items.map(item => (
              <motion.div key={item._id}
                initial={{ opacity: 1, x: 0, scaleY: 1 }}
                exit={{ opacity: 0, x: 100, scaleY: 0 }}
                transition={{ duration: 0.35 }}
                className={`bg-white/3 border rounded-xl p-4 border-white/10 hover:border-neon-green/30 transition-colors ${deletingId === item._id ? 'opacity-30' : ''}`}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-mono font-black text-neon-green">{item.maskedTarget}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${DIFF_COLORS[item.difficultyLabel] || 'text-white/40'} border-current bg-current/10`}>
                        {item.difficultyLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                      <div>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Attempts</p>
                        <p className="text-xs font-mono text-neon-green font-bold">{item.totalAttempts.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Time</p>
                        <p className="text-xs font-mono text-neon-amber font-bold">{fmt(item.timeTakenMs)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Mode</p>
                        <p className="text-xs font-mono text-white/60">{item.modeUsed}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Real Crack</p>
                        <p className="text-xs font-mono text-neon-red font-bold">{item.estimatedCrackTime}</p>
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-white/20 mt-2">
                      {item.dateTime ? format(new Date(item.dateTime), 'MMM dd yyyy — HH:mm') : '—'}
                    </p>
                  </div>

                  <button onClick={() => item._id && deleteItem(item._id)}
                    className="text-neon-red/40 hover:text-neon-red transition-colors text-lg flex-shrink-0 mt-1">
                    🗑
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
