import { Page } from '@playwright/test';

const DB_NAME = 'bunda_journal_db';

/** Baca satu nilai dari IndexedDB `app_data` (dipakai media store). */
export async function readIdb(page: Page, key: string): Promise<string | null> {
  return page.evaluate(
    ({ dbName, key }) =>
      new Promise<string | null>((resolve) => {
        const req = indexedDB.open(dbName, 1);
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('app_data')) return resolve(null);
          const tx = db.transaction('app_data', 'readonly');
          const get = tx.objectStore('app_data').get(key);
          get.onsuccess = () => resolve((get.result as { value?: string } | undefined)?.value ?? null);
          get.onerror = () => resolve(null);
        };
      }),
    { dbName: DB_NAME, key }
  );
}
