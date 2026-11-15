// IndexedDB Helper for Bunda Journal Offline-First Storage & Sync Queue
const DB_NAME = 'bunda_journal_db';
const DB_VERSION = 1;
const STORE_DATA = 'app_data';
const STORE_QUEUE = 'sync_queue';

export interface OutboxItem {
  id?: number;
  table: string;
  data: any;
  action: 'insert' | 'update' | 'upsert';
  timestamp: number;
  synced: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('synced', 'synced', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Satu koneksi dipakai bersama; kalau gagal, dicoba lagi di panggilan berikutnya. */
function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/** Antrean tulis: menjamin tulisan terakhir yang menang (urutan tidak acak). */
let writeChain: Promise<unknown> = Promise.resolve();

async function runPut(key: string, value: any): Promise<boolean> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_DATA, 'readwrite');
    tx.objectStore(STORE_DATA).put({ key, value, updatedAt: Date.now() });
    return await new Promise<boolean>((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
  } catch (err) {
    console.warn('[IDB] put failed', err);
    return false;
  }
}

export function idbPut(key: string, value: any): Promise<boolean> {
  const run = writeChain.then(
    () => runPut(key, value),
    () => runPut(key, value)
  );
  writeChain = run.catch(() => {});
  return run;
}

export async function idbSet(key: string, value: any): Promise<void> {
  const ok = await idbPut(key, value);
  if (!ok) console.warn('[IDB] set failed, fallback localStorage only');
}

export async function idbGet<T = any>(key: string): Promise<T | null> {  try {
    const db = await getDB();
    const tx = db.transaction(STORE_DATA, 'readonly');
    const store = tx.objectStore(STORE_DATA);
    const req = store.get(key);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_DATA, 'readwrite');
    tx.objectStore(STORE_DATA).delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function addToSyncQueue(item: Omit<OutboxItem, 'id' | 'timestamp' | 'synced'>): Promise<number | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.add({
      ...item,
      timestamp: Date.now(),
      synced: false,
    });
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const items = req.result || [];
        resolve(items.filter((i: any) => !i.synced).length);
      };
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function markQueueSynced(id: number): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    store.delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function getPendingQueueItems(): Promise<OutboxItem[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []).filter((i: OutboxItem) => !i.synced));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
