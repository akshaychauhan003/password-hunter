'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberUI';
import { useSound } from '@/hooks/useSound';
import type { HistoryItem } from '@/types';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
  refreshTrigger?: number;
}

const DIFF_COLORS: Record<string, string> = {
  Easy:       'theme-primary-text',
  Medium:     'text-[var(--theme-accent)]',
  Hard:       'text-orange-400',
  Extreme:    'text-[var(--theme-danger)]',
  Impossible: 'theme-secondary-text',
};

function dedupeItems(items: HistoryItem[]): HistoryItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const id = (item._id as string) || '';
    const key = id || `${item.maskedTarget}-${item.dateTime}-${item.totalAttempts}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function HistoryPanel({ onClose, refreshTrigger = 0 }: Props) {
  const [items, setItems]         = useState<HistoryItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sound = useSound();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (filter) params.set('difficulty', filter);

      const res  = await fetch(`/api/history?${params}`);
      const json = await res.json();

      if (json.success) {
        const data = json.data || {};
        setItems(dedupeItems(data.items || []));
        setTotal(data.total ?? 0);
      } else {
        setError(json.error || 'Failed to load history');
      }
    } catch (e) {
      console.error('[HistoryPanel] fetch error:', e);
      setError('Could not connect to history service');
    }
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory, refreshTrigger]);

  const deleteItem = async (id: string) => {
    sound.playDelete?.();
    setDeletingId(id);
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setItems(prev => prev.filter(i => (i._id || '') !== id));
        setTotal(t => Math.max(0, t - 1));
      }
    } catch (e) {
      console.error('[HistoryPanel] delete error:', e);
    }
    setDeletingId(null);
  };

  const clearAll = async () => {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    sound.playDelete?.();
    try {
      const res = await fetch('/api/history/all', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('[HistoryPanel] clear all error:', e);
    }
  };

  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    if (m > 0) return `${m}m ${s % 60}s`;
    return s > 0 ? `${s}s` : `${ms}ms`;
  };

  const fmtNum = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>

      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">

        <motion.div className="flex justify-between items-center mb-4">
          <motion.div>
            <h2 className="font-mono font-bold tracking-widest text-sm theme-primary-text">
              ☰ SIMULATION HISTORY
            </h2>
            <p className="text-[10px] font-mono theme-muted-text mt-0.5">
              {loading ? 'Loading…' : `${total} record${total !== 1 ? 's' : ''} found`}
            </p>
          </motion.div>
          <div className="flex gap-2">
            <CyberButton variant="ghost" size="sm" onClick={fetchHistory} title="Refresh">↺</CyberButton>
            {items.length > 0 && (
              <CyberButton variant="red" size="sm" onClick={clearAll}>🗑 Clear All</CyberButton>
            )}
            <CyberButton variant="ghost" size="sm" onClick={onClose}>✕</CyberButton>
          </div>
        </motion.div>

        <motion.div className="flex gap-2 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search history…"
            className="flex-1 cyber-input rounded-lg px-3 py-2 font-mono text-xs" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="cyber-input rounded-lg px-3 py-2 font-mono text-xs">
            <option value="">All</option>
            {['Easy', 'Medium', 'Hard', 'Extreme', 'Impossible'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </motion.div>

        <div className="flex-1 overflow-y-auto terminal-scroll space-y-3 pr-1">

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin mb-3"
                style={{ borderColor: 'var(--theme-border)', borderTopColor: 'var(--theme-primary)' }} />
              <p className="theme-muted-text font-mono text-sm">Loading history...</p>
            </div>
          )}

          {!loading && error && (
            <motion.div className="text-center py-8">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="font-mono text-sm" style={{ color: 'var(--theme-danger)' }}>{error}</p>
              <button onClick={fetchHistory}
                className="mt-3 theme-secondary-text font-mono text-xs hover:opacity-80 underline">
                Try again
              </button>
            </motion.div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔒</p>
              <p className="theme-muted-text font-mono text-sm">No records found</p>
              <p className="font-mono text-xs mt-1 opacity-50">
                {search || filter ? 'Try clearing the filter' : 'Run a simulation to see results here'}
              </p>
            </div>
          )}

          <AnimatePresence>
            {items.map(item => {
              const id = item._id || '';
              const isDeleting = deletingId === id;
              return (
                <motion.div key={id || `${item.maskedTarget}-${item.dateTime}`}
                  initial={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 80, scaleY: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl p-4 transition-all duration-200 border ${
                    isDeleting ? 'opacity-20 scale-95' : ''
                  }`}
                  style={{
                    background: 'var(--theme-primary-faint)',
                    borderColor: isDeleting ? undefined : 'var(--theme-border)',
                  }}>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-mono font-black theme-primary-text">
                          {item.maskedTarget}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          DIFF_COLORS[item.difficultyLabel] || 'theme-muted-text'
                        } border-current bg-current/10`}>
                          {item.difficultyLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                        <div>
                          <p className="text-[9px] font-mono theme-muted-text uppercase tracking-wider">Attempts</p>
                          <p className="text-xs font-mono font-bold theme-primary-text">{fmtNum(item.totalAttempts)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono theme-muted-text uppercase tracking-wider">Time</p>
                          <p className="text-xs font-mono font-bold" style={{ color: 'var(--theme-accent)' }}>{fmtMs(item.timeTakenMs)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono theme-muted-text uppercase tracking-wider">Mode</p>
                          <p className="text-xs font-mono theme-muted-text">{item.modeUsed}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono theme-muted-text uppercase tracking-wider">Real Crack</p>
                          <p className="text-xs font-mono font-bold" style={{ color: 'var(--theme-danger)' }}>{item.estimatedCrackTime}</p>
                        </div>
                      </div>

                      <p className="text-[10px] font-mono mt-2 opacity-40">
                        {item.dateTime
                          ? format(new Date(item.dateTime), 'MMM dd yyyy — HH:mm')
                          : '—'}
                      </p>
                    </div>

                    {id && (
                      <button
                        onClick={() => deleteItem(id)}
                        disabled={!!deletingId}
                        className="transition-colors text-lg flex-shrink-0 mt-1 disabled:opacity-30"
                        style={{ color: 'var(--theme-danger)' }}
                        title="Delete entry">
                        🗑
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
