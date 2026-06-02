// Cache LRU mémoire (in-process, sans dépendance).
// Sert à éviter de marteler les APIs publiques pour la même requête.

const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 min
const DEFAULT_MAX = 500;

class LRU {
  constructor(max = DEFAULT_MAX, ttlMs = DEFAULT_TTL_MS) {
    this.max = max;
    this.ttl = ttlMs;
    this.map = new Map();
  }
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return undefined;
    }
    // touch
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }
  set(key, value, ttlMs) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + (ttlMs ?? this.ttl) });
    if (this.map.size > this.max) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
  }
  has(key) {
    return this.get(key) !== undefined;
  }
  clear() {
    this.map.clear();
  }
  size() {
    return this.map.size;
  }
}

// Cache global partagé entre routes pour la durée du process.
// En production, à remplacer par Redis / KV store.
const globalAny = globalThis;
if (!globalAny.__terraCache) {
  globalAny.__terraCache = new LRU();
}
export const cache = globalAny.__terraCache;

/**
 * Helper : wrap un fetcher async. Si la clé est en cache, retourne la valeur cachée.
 * Sinon appelle fn(), met en cache, et retourne.
 */
export async function cached(key, fn, ttlMs) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cache.set(key, value, ttlMs);
  return value;
}
