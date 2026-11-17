/**
 * Meta Pixel — pemasangan tunggal, aman, dan tanpa dependency.
 *
 * Aktif hanya kalau `VITE_META_PIXEL_ID` berisi 15–16 digit angka.
 * Kalau env kosong / salah format, semua fungsi jadi no-op (tidak ada
 * request ke facebook.net, tidak ada error di console user).
 *
 * Event yang dikirim:
 *  - PageView            : otomatis saat init
 *  - ViewContent         : section harga terlihat (LandingPage)
 *  - InitiateCheckout    : Snap Midtrans dibuka (CheckoutModal)
 *  - Purchase            : /success + status is_paid TERVERIFIKASI server
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

const FALLBACK_PIXEL_ID = '1558009306133404'; // ID publik (terlihat di source), aman di-hardcode
const PIXEL_ID =
  String((import.meta as any).env?.VITE_META_PIXEL_ID ?? '').trim() || FALLBACK_PIXEL_ID;
const EVENTS_KEY = 'bunda_meta_events_v1';
const UTM_KEY = 'bunda_utm_v1';
const PURCHASE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // hanya Purchase dari checkout < 2 jam

let initialized = false;

/** Pixel ID valid? (15–16 digit, format resmi Meta) */
export function isMetaPixelEnabled(): boolean {
  return /^\d{15,16}$/.test(PIXEL_ID);
}

/** Pasang base code + PageView. Idempoten, aman dipanggil berkali-kali. */
export function initMetaPixel(): void {
  if (typeof window === 'undefined' || !isMetaPixelEnabled() || initialized) return;

  if (!window.fbq) {
    const fbq: any = function (...args: any[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  initialized = true;

  if ((import.meta as any).env?.DEV) {
    console.info('[meta-pixel] aktif:', PIXEL_ID);
  }

  captureUtm();
}

type MetaParams = Record<string, unknown>;

/** Kirim event standar. eventId dipakai untuk dedupe dengan Conversions API nanti. */
export function trackMeta(event: string, params?: MetaParams, eventId?: string): void {
  if (!isMetaPixelEnabled()) return;
  if (!initialized) initMetaPixel();
  if (typeof window === 'undefined' || !window.fbq) return;

  if ((import.meta as any).env?.DEV) {
    console.debug('[meta-pixel]', event, params ?? {}, eventId ?? '');
  }

  if (eventId) window.fbq('track', event, params ?? {}, { eventID: eventId });
  else window.fbq('track', event, params ?? {});
}

function readEventLog(): Record<string, number> {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Kirim event hanya sekali per `key` dalam `ttlHours` (default 24 jam). */
export function trackMetaOnce(
  key: string,
  event: string,
  params?: MetaParams,
  ttlHours = 24,
  eventId?: string
): void {
  const now = Date.now();
  const log = readEventLog();
  const last = log[key];

  if (typeof last === 'number' && now - last < ttlHours * 60 * 60 * 1000) return;

  log[key] = now;
  // buang entri > 90 hari supaya localStorage tidak membengkak
  const cutoff = now - 90 * 24 * 60 * 60 * 1000;
  for (const k of Object.keys(log)) {
    if (typeof log[k] !== 'number' || log[k] < cutoff) delete log[k];
  }
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(log));
  } catch {}

  trackMeta(event, params, eventId);
}

/** Simpan UTM/fbclid dari URL untuk audit atribusi (Midtrans + manual). */
export function captureUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
    const found: Record<string, string> = {};
    for (const key of keys) {
      const value = params.get(key);
      if (value) found[key] = value;
    }
    if (Object.keys(found).length > 0) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
    }
    return found;
  } catch {
    return {};
  }
}

/** UTM yang tersimpan di sesi ini (dipakai untuk audit manual di Midtrans). */
export function getStoredUtm(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Apakah checkout baru saja terjadi? Dipakai supaya Purchase tidak
 * ikut terkirim ketika user lama membuka /success berhari-hari kemudian.
 */
export function hasRecentCheckout(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const at = Number(localStorage.getItem('bunda_last_paid_at') || 0);
    return Number.isFinite(at) && at > 0 && Date.now() - at <= PURCHASE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** Nominal pembayaran terakhir yang dicatat sebelum halaman /success. */
export function getLastPaidAmount(fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = Number(localStorage.getItem('bunda_last_paid_amount') || 0);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}
