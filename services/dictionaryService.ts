// Service to handle dictionary loading with IndexedDB caching and compression

const DB_NAME = 'mkbee-dictionary';
const STORE_NAME = 'dictionary';
const CURRENT_VERSION = 1; // Increment when dictionary updates
const IS_DEV = import.meta.env.DEV;

interface DictionaryCache {
  version: number;
  timestamp: number;
  words: string[];
}

/**
 * Open IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get dictionary from IndexedDB cache
 */
async function getCachedDictionary(): Promise<string[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get('main');
      request.onsuccess = () => {
        const cached: DictionaryCache | undefined = request.result;
        if (cached && cached.version === CURRENT_VERSION) {
          if (IS_DEV) console.log('✅ Dictionary loaded from IndexedDB cache');
          resolve(cached.words);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('IndexedDB access failed:', error);
    return null;
  }
}

/**
 * Cache dictionary to IndexedDB
 */
async function cacheDictionary(words: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const cache: DictionaryCache = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      words
    };

    store.put(cache, 'main');
    if (IS_DEV) console.log('✅ Dictionary cached in IndexedDB');
  } catch (error) {
    console.warn('Failed to cache dictionary:', error);
  }
}

/**
 * Fetch and decompress dictionary from network
 */
async function fetchAndDecompressDictionary(): Promise<string[]> {
  // 1. Try Gzip (.gz) first if DecompressionStream is supported
  if (typeof DecompressionStream !== 'undefined') {
    try {
      if (IS_DEV) console.log('📥 Fetching dictionary from network (Gzip)...');
      const gzipResponse = await fetch(`${import.meta.env.BASE_URL}data/mk_words.json.gz`);

      if (gzipResponse.ok && gzipResponse.body) {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = gzipResponse.body.pipeThrough(ds);
        const text = await new Response(decompressedStream).text();
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn('Gzip fetch/decompression failed, falling back to raw JSON:', e);
    }
  }

  // 2. Fallback to uncompressed
  try {
    if (IS_DEV) console.log('📥 Fetching dictionary from network (JSON)...');
    const response = await fetch(`${import.meta.env.BASE_URL}data/mk_words.json`);
    if (!response.ok) {
      throw new Error(`Failed to load dictionary: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('All dictionary fetch methods failed:', error);
    throw error;
  }
}

export async function loadDictionary(): Promise<string[]> {
  // 1. Try IndexedDB cache first
  const cached = await getCachedDictionary();
  if (cached) {
    return cached;
  }

  // 2. Fetch from network (prefer compressed)
  const words = await fetchAndDecompressDictionary();

  // 3. Cache for next time
  await cacheDictionary(words);

  return words;
}
