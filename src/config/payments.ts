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

// Payment paused total (Mode Perbaikan): baik Dev maupun Production.
export const PAYMENT_PAUSED = true;

export const isDevPaymentEnabled = () => IS_LOCAL_DEV && readFlag();

export function setDevPaymentEnabled(on: boolean) {
  try {
    storageSet(LS_KEY, on ? 'true' : 'false');
  } catch {}
  location.reload();
}
