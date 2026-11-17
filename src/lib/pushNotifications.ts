import { storageGet, storageSet, storageRemove } from './storage/appStorage';
import { getToken } from './authClient';
import type { ReminderSettings } from '../types';

const DEVICE_KEY = 'bunda_push_device_id';
const ENABLED_KEY = 'bunda_push_enabled';
const OPTOUT_KEY = 'bunda_push_optout';
const PROMPT_SNOOZE_KEY = 'bunda_push_prompt_snooze';

export interface PushReminderPayload {
  tag: string;
  title: string;
  body: string;
  timeLocal: string;
  enabled: boolean;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isPushEnabled(): boolean {
  try {
    return storageGet(ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Default aktif: user baru otomatis ditawari, kecuali pernah memilih "matikan". */
export function isPushOptedOut(): boolean {
  try {
    return storageGet(OPTOUT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function shouldPromptPushPermission(): boolean {
  if (!isPushSupported() || isPushOptedOut() || isPushEnabled()) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return false;
  try {
    const snooze = Number(storageGet(PROMPT_SNOOZE_KEY) || '0');
    return !snooze || Date.now() > snooze;
  } catch {
    return true;
  }
}

export function snoozePushPrompt(days = 7) {
  try { storageSet(PROMPT_SNOOZE_KEY, String(Date.now() + days * 86400000)); } catch {}
}

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
  deviceId: string;
}

export function getPushStatus(): PushStatus {
  const supported = isPushSupported();
  return {
    supported,
    permission: supported && typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    enabled: isPushEnabled(),
    deviceId: getDeviceId(),
  };
}

export interface ServerPushStatus {
  exists: boolean;
  reminders: number;
  tzOffsetMinutes?: number;
  updatedAt?: string;
}

export async function getServerPushStatus(): Promise<ServerPushStatus> {
  const deviceId = getDeviceId();
  const res = await fetch(`/api/push/status?deviceId=${encodeURIComponent(deviceId)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data.error || 'Gagal membaca status push.');
  return {
    exists: Boolean(data.exists),
    reminders: Number(data.reminders || 0),
    tzOffsetMinutes: data.tzOffsetMinutes,
    updatedAt: data.updatedAt,
  };
}

function getDeviceId(): string {
  try {
    const saved = storageGet(DEVICE_KEY);
    if (saved && /^[A-Za-z0-9_-]{8,80}$/.test(saved)) return saved;
  } catch {}
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `dev${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  try { storageSet(DEVICE_KEY, id); } catch {}
  return id;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function sanitizeTag(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 40);
}

/** Daftar pengingat yang disinkronkan ke server (hanya metadata). */
export function buildPushReminders(settings: ReminderSettings): PushReminderPayload[] {
  if (!settings.enabled) return [];
  const out: PushReminderPayload[] = [
    {
      tag: 'bunda-vitamin',
      title: 'Bunda Journal — Minum vitamin',
      body: 'Asam folat & zat besi penting untuk perkembangan sel darah dan saraf buah hati hari ini.',
      timeLocal: settings.vitaminTime,
      enabled: true,
    },
    {
      tag: 'bunda-journal',
      title: 'Bunda Journal — Isi jurnal',
      body: 'Luangkan waktu sejenak untuk mencatat momen manis kehamilan hari ini.',
      timeLocal: settings.journalTime,
      enabled: true,
    },
  ];

  (settings.customReminders || []).forEach((item) => {
    if (!item?.id || !item.title?.trim() || !item.time) return;
    out.push({
      tag: sanitizeTag(`custom-${item.id}`),
      title: `Bunda Journal — ${item.title.trim()}`,
      body: item.message?.trim() || 'Pengingat dari Bunda Journal.',
      timeLocal: item.time,
      enabled: item.enabled !== false,
    });
  });

  return out;
}

async function postJson(url: string, body: any) {
  const token = getToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(data.error || `Permintaan gagal (${res.status}).`);
  return data;
}

async function postSubscription(
  subscription: PushSubscription,
  settings: ReminderSettings
) {
  return postJson('/api/push/subscribe', {
    deviceId: getDeviceId(),
    tzOffsetMinutes: new Date().getTimezoneOffset(),
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || '',
      },
    },
    reminders: buildPushReminders(settings),
  });
}

async function getConfig(): Promise<string> {
  const res = await fetch('/api/push/config', { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.enabled || !data?.publicKey) {
    throw new Error('Notifikasi latar belakang belum diaktifkan di server.');
  }
  return String(data.publicKey);
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('Browser tidak mendukung service worker.');
  return navigator.serviceWorker.ready;
}

export async function enablePush(settings: ReminderSettings): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Browser ini belum mendukung notifikasi push. Di iPhone, pasang dulu ke Home Screen.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak. Izinkan dari pengaturan browser.');
  }

  const publicKey = await getConfig();
  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });
  }

  await postSubscription(subscription, settings);
  try {
    storageSet(ENABLED_KEY, 'true');
    storageSet(OPTOUT_KEY, 'false');
  } catch {}
}

export async function syncPushReminders(settings: ReminderSettings): Promise<void> {
  if (!isPushEnabled() || !isPushSupported()) return;
  try {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await postSubscription(subscription, settings);
  } catch (err) {
    console.warn('syncPushReminders gagal', err);
  }
}

export async function disablePush(): Promise<void> {
  try {
    if (isPushSupported()) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe().catch(() => {});
    }
  } catch {}
  try {
    await postJson('/api/push/unsubscribe', { deviceId: getDeviceId() });
  } catch {}
  try {
    storageRemove(ENABLED_KEY);
    storageSet(OPTOUT_KEY, 'true');
  } catch {}
}
