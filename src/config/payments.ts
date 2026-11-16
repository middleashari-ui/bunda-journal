import { storageGet, storageSet } from '../lib/storage/appStorage';
// Dev lokal (localhost / vite dev) = Midtrans SANDBOX, uang bohongan + toggle ON/OFF.
// Production = Midtrans PRODUCTION, toggle tidak dirender sama sekali.
export const IS_LOCAL_DEV = import.meta.env.DEV;

const LS_KEY = 'bunda_payment_enabled';

const readFlag = () => {
  try {
    return storageGet(LS_KEY) === 'true';
  } catch {
    return false;
  }
};

// Mode pembayaran: aktif. Kill switch darurat ada di server
// (env PAYMENT_PAUSED="true" di Cloudflare Pages) tanpa perlu deploy ulang.
export const PAYMENT_PAUSED = false;

// Diturunkan dari URL Snap yang di-inject saat build (.env vs .env.production).
export const PAYMENT_MODE: 'sandbox' | 'production' = String(
  import.meta.env.VITE_MIDTRANS_SNAP_URL || ''
).includes('sandbox')
  ? 'sandbox'
  : 'production';

export const isDevPaymentEnabled = () => IS_LOCAL_DEV && readFlag();

export function setDevPaymentEnabled(on: boolean) {
  try {
    storageSet(LS_KEY, on ? 'true' : 'false');
  } catch {}
  location.reload();
}
