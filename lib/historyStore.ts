import { nanoid } from 'nanoid';

export interface MemoryHistoryItem {
  _id: string;
  userId: string;
  target: string;
  maskedTarget: string;
  dateTime: Date;
  totalAttempts: number;
  timeTakenMs: number;
  modeUsed: string;
  discoveryMode?: string;
  eyeState?: string;
  difficultyLabel: string;
  difficultyScore: number;
  estimatedCrackTime: string;
  charLength: number;
  charsetSize: number;
  entropy: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _memHistory: MemoryHistoryItem[] | undefined;
}

const MAX_ENTRIES = 500;
const DEDUP_WINDOW_MS = 5_000;

/** Singleton in-memory store (survives dev hot-reload via globalThis). */
export function getMemStore(): MemoryHistoryItem[] {
  if (!global._memHistory) global._memHistory = [];
  return global._memHistory;
}

export function addMemHistoryItem(
  data: Omit<MemoryHistoryItem, '_id' | 'userId' | 'dateTime'>,
): MemoryHistoryItem {
  const store = getMemStore();
  const now = Date.now();

  // Prevent duplicate entries from double-fire (e.g. strict mode / rapid re-run)
  const duplicate = store.find(
    i =>
      i.userId === 'anonymous' &&
      i.target === data.target &&
      i.modeUsed === data.modeUsed &&
      now - new Date(i.dateTime).getTime() < DEDUP_WINDOW_MS,
  );
  if (duplicate) return duplicate;

  const item: MemoryHistoryItem = {
    _id: nanoid(),
    userId: 'anonymous',
    dateTime: new Date(),
    ...data,
  };
  store.unshift(item);
  if (store.length > MAX_ENTRIES) store.splice(MAX_ENTRIES);
  return item;
}

export function deleteMemHistoryItem(id: string): boolean {
  const store = getMemStore();
  const idx = store.findIndex(i => i._id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

export function clearMemHistory(userId = 'anonymous'): number {
  const store = getMemStore();
  let removed = 0;
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].userId === userId) {
      store.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

export function queryMemHistory(opts: {
  userId?: string;
  search?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}): { items: MemoryHistoryItem[]; total: number; page: number; limit: number } {
  const {
    userId = 'anonymous',
    search = '',
    difficulty = '',
    page = 1,
    limit = 20,
  } = opts;

  let filtered = getMemStore().filter(i => i.userId === userId);
  if (search) filtered = filtered.filter(i => i.maskedTarget.toLowerCase().includes(search.toLowerCase()));
  if (difficulty) filtered = filtered.filter(i => i.difficultyLabel === difficulty);
  filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);
  return { items, total, page, limit };
}
