// ============================================================================
// BACKUP JURNAL KE GOOGLE DRIVE MILIK USER
//
// Prinsip:
// - Data jurnal TIDAK pernah dikirim ke server Bunda (mode lokal).
// - Backup hanya ke Drive user sendiri, lewat Google Identity Services
//   (token model: access token disimpan di perangkat ini, bukan di server).
// - Satu file JSON per hari: bunda-backup-YYYY-MM-DD.json di folder "Bunda Journal".
// - Upload hanya kalau isi berubah (dibandingkan lewat hash SHA-256).
// ============================================================================

import { applyUserPayload, collectUserPayload, getToken } from './authClient';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Bunda Journal';
const TOKEN_CACHE_KEY = 'bunda_drive_token';
const META_KEY = 'bunda_drive_backup_meta';
const AUTO_KEY = 'bunda_drive_autobackup';
const CLIENT_ID_KEY = 'bunda_google_client_id';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveBackupMeta {
  at: string;
  fileId: string;
  name: string;
  hash: string;
  bytes: number;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------
function readCachedToken(): string {
  try {
    const raw = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.expiresAt) return '';
    if (Date.now() > Number(parsed.expiresAt) - 60_000) return '';
    return String(parsed.accessToken);
  } catch {
    return '';
  }
}

function writeCachedToken(accessToken: string, expiresInSec: number) {
  try {
    localStorage.setItem(
      TOKEN_CACHE_KEY,
      JSON.stringify({ accessToken, expiresAt: Date.now() + expiresInSec * 1000 })
    );
  } catch {}
}

export function clearDriveToken() {
  try { localStorage.removeItem(TOKEN_CACHE_KEY); } catch {}
}

async function loadGis(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('no-window');
  if (window.google?.accounts?.oauth2) return window.google;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-bunda-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gsi-load-failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.bundaGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(script);
  });
  if (!window.google?.accounts?.oauth2) throw new Error('gsi-unavailable');
  return window.google;
}

async function resolveClientId(): Promise<string> {
  try {
    const cached = localStorage.getItem(CLIENT_ID_KEY) || '';
    if (cached) return cached;
  } catch {}
  try {
    const res = await fetch('/api/google-config', { cache: 'no-store' });
    const data = await res.json();
    const id = String(data?.clientId || '').trim();
    if (id) {
      try { localStorage.setItem(CLIENT_ID_KEY, id); } catch {}
      return id;
    }
  } catch {}
  return '';
}

/**
 * Minta access token Drive.
 * `interactive=false` dipakai untuk auto-backup: hanya jalan kalau user
 * sebelumnya sudah memberi izin (tanpa popup).
 */
export async function requestDriveToken(interactive = true): Promise<string | null> {
  const cached = readCachedToken();
  if (cached) return cached;

  const clientId = await resolveClientId();
  if (!clientId) throw new Error('google-not-configured');

  const google = await loadGis();
  return new Promise<string | null>((resolve, reject) => {
    let settled = false;
    const finish = (value: string | null, error?: Error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value);
    };

    let client: any;
    try {
      client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp: any) => {
          if (resp?.access_token) {
            writeCachedToken(resp.access_token, Number(resp.expires_in) || 3600);
            finish(resp.access_token);
          } else {
            finish(null, new Error(resp?.error || 'token-failed'));
          }
        },
        error_callback: (err: any) => finish(null, new Error(err?.type || 'token-error')),
      });
      client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    } catch (err: any) {
      finish(null, new Error(err?.message || 'token-init-failed'));
    }

    // Jangan menggantung selamanya kalau popup ditutup tanpa callback.
    setTimeout(() => finish(null), interactive ? 120_000 : 20_000);
  });
}

// ---------------------------------------------------------------------------
// Drive REST helpers
// ---------------------------------------------------------------------------
async function driveJson(path: string, token: string): Promise<any> {
  const res = await fetch(`${DRIVE_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`drive-${res.status}`);
  return res.json();
}

async function findFolder(token: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const data = await driveJson(`/files?q=${q}&fields=files(id,name)&spaces=drive`, token);
  return data?.files?.[0]?.id || null;
}

async function createFolder(token: string): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  if (!res.ok) throw new Error(`drive-folder-${res.status}`);
  const data = await res.json();
  return data.id as string;
}

async function ensureFolder(token: string): Promise<string> {
  return (await findFolder(token)) || (await createFolder(token));
}

function todayStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------
export function buildBackupJson(extra: Record<string, unknown> = {}): { json: string; payload: Record<string, string> } {
  const payload = collectUserPayload();
  const body = {
    app: 'bunda-journal',
    format: 'bunda-journal-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    email: (() => {
      try { return localStorage.getItem('bunda_user_email') || ''; } catch { return ''; }
    })(),
    data: payload,
    ...extra,
  };
  return { json: JSON.stringify(body, null, 2), payload };
}

export function getBackupMeta(): DriveBackupMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as DriveBackupMeta) : null;
  } catch {
    return null;
  }
}

function setBackupMeta(meta: DriveBackupMeta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
}

export function isAutoBackupEnabled(): boolean {
  try { return localStorage.getItem(AUTO_KEY) === 'true'; } catch { return false; }
}

export function setAutoBackupEnabled(value: boolean) {
  try { localStorage.setItem(AUTO_KEY, value ? 'true' : 'false'); } catch {}
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
export interface BackupResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  meta?: DriveBackupMeta;
}

export async function backupJournalToDrive(options?: {
  interactive?: boolean;
  force?: boolean;
}): Promise<BackupResult> {
  const interactive = options?.interactive ?? true;
  const force = options?.force ?? false;

  const { json } = buildBackupJson();
  if (!json || json.length < 20) return { ok: false, reason: 'empty' };

  const hash = await sha256Hex(json);
  const meta = getBackupMeta();
  if (!force && meta && meta.hash === hash) return { ok: true, skipped: true, meta };

  let token: string | null = null;
  try {
    token = await requestDriveToken(interactive);
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'auth-failed' };
  }
  if (!token) return { ok: false, reason: 'auth-required' };

  try {
    const folderId = await ensureFolder(token);
    const name = `bunda-backup-${todayStamp()}.json`;
    const bytes = new Blob([json]).size;

    // Update file hari ini kalau sudah ada (lebih hemat daripada bikin baru terus).
    if (meta?.fileId && meta.name === name) {
      const res = await fetch(`${UPLOAD_API}/files/${meta.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: json,
      });
      if (!res.ok && res.status !== 404) throw new Error(`drive-update-${res.status}`);
      if (res.ok) {
        const next: DriveBackupMeta = { at: new Date().toISOString(), fileId: meta.fileId, name, hash, bytes };
        setBackupMeta(next);
        return { ok: true, meta: next };
      }
    }

    // Buat file baru (multipart: metadata + isi).
    const boundary = 'bunda' + Math.random().toString(16).slice(2);
    const body =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({ name, parents: [folderId], mimeType: 'application/json' }) +
      `\r\n--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      json +
      `\r\n--${boundary}--`;

    const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) throw new Error(`drive-create-${res.status}`);
    const created = await res.json();
    const next: DriveBackupMeta = { at: new Date().toISOString(), fileId: created.id, name, hash, bytes };
    setBackupMeta(next);
    return { ok: true, meta: next };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'upload-failed' };
  }
}

/** Auto-backup: maksimal sekali per 24 jam, tanpa popup. Gagal = diam saja. */
export async function maybeAutoBackup(): Promise<BackupResult> {
  if (!isAutoBackupEnabled()) return { ok: false, reason: 'disabled' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, reason: 'offline' };
  const meta = getBackupMeta();
  if (meta && Date.now() - new Date(meta.at).getTime() < 24 * 60 * 60 * 1000) {
    return { ok: true, skipped: true, meta };
  }
  const result = await backupJournalToDrive({ interactive: false, force: false });
  if (result.reason === 'auth-required' || result.reason === 'auth-failed') clearDriveToken();
  return result;
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------
export async function listDriveBackups(): Promise<DriveFileInfo[]> {
  const token = await requestDriveToken(true);
  if (!token) throw new Error('auth-required');
  const folderId = await ensureFolder(token);
  const q = encodeURIComponent(
    `'${folderId}' in parents and name contains 'bunda-backup-' and trashed=false`
  );
  const data = await driveJson(
    `/files?q=${q}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,modifiedTime,size)`,
    token
  );
  return (data?.files || []) as DriveFileInfo[];
}

export async function downloadBackup(fileId: string): Promise<{ ok: boolean; reason?: string; at?: string; count?: number }> {
  const token = await requestDriveToken(true);
  if (!token) return { ok: false, reason: 'auth-required' };
  try {
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, reason: `download-${res.status}` };
    const parsed = await res.json();
    const data = parsed?.data;
    if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid-file' };
    const email = parsed?.email || localStorage.getItem('bunda_user_email') || '';
    // applyUserPayload otomatis membuat snapshot sebelum menimpa (bisa di-undo).
    applyUserPayload(data as Record<string, string>, email);
    return { ok: true, at: parsed?.exportedAt, count: Object.keys(data).length };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'restore-failed' };
  }
}

export function hasSessionForDrive(): boolean {
  return !!getToken();
}
