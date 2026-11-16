// Log error ringan di perangkat. Tidak dikirim ke server (privasi), hanya
// disimpan lokal dan bisa diunduh dari Profil untuk diagnosis.
import { storageGetJson, storageRemove, storageSetJson } from './storage/appStorage';

export const ERROR_LOG_KEY = 'bunda_error_log';
const MAX_ENTRIES = 50;

export interface AppErrorEntry {
  at: string;
  message: string;
  source?: string;
  stack?: string;
}

export function getErrorLog(): AppErrorEntry[] {
  return storageGetJson<AppErrorEntry[]>(ERROR_LOG_KEY, []);
}

export function clearErrorLog(): void {
  try {
    storageRemove(ERROR_LOG_KEY);
  } catch {}
}

export function logError(message: unknown, extra: { source?: string; stack?: string } = {}): void {
  try {
    const text = String((message as { message?: string })?.message || message || 'unknown error');
    const list = getErrorLog();
    list.push({
      at: new Date().toISOString(),
      message: text.slice(0, 500),
      source: extra.source ? String(extra.source).slice(0, 300) : undefined,
      stack: extra.stack ? String(extra.stack).slice(0, 1200) : undefined,
    });
    storageSetJson(ERROR_LOG_KEY, list.slice(-MAX_ENTRIES));
  } catch {}
}

/** Pasang listener global sekali saat boot. */
export function installErrorLogging(): void {
  if (typeof window === 'undefined' || (window as { __bundaErrorLogInstalled?: boolean }).__bundaErrorLogInstalled) {
    return;
  }
  (window as { __bundaErrorLogInstalled?: boolean }).__bundaErrorLogInstalled = true;

  window.addEventListener('error', (event) => {
    const err = (event as ErrorEvent).error as { stack?: string } | undefined;
    logError((event as ErrorEvent).message || 'window error', {
      source: (event as ErrorEvent).filename,
      stack: err?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason as { message?: string; stack?: string } | undefined;
    logError(reason?.message || String(reason || 'unhandled rejection'), {
      source: 'unhandledrejection',
      stack: reason?.stack,
    });
  });
}
