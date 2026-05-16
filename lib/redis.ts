import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;
let connected = false;

export async function getRedisClient() {
  if (client && connected) return client;
  try {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', () => { connected = false; });
    client.on('connect', () => { connected = true; });
    await client.connect();
    connected = true;
    return client;
  } catch {
    connected = false;
    return null; // graceful fallback — app works without Redis
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const c = await getRedisClient();
    if (!c) return null;
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    await c.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    await c.del(key);
  } catch { /* non-fatal */ }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    const keys = await c.keys(pattern);
    if (keys.length) await c.del(keys);
  } catch { /* non-fatal */ }
}
