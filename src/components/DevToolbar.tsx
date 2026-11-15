import React, { useState } from 'react';
import { IS_LOCAL_DEV, isDevPaymentEnabled, setDevPaymentEnabled } from '../config/payments';

// DevToolbar: HANYA dev lokal. Di production render null total.
export const DevToolbar: React.FC = () => {
  const [busy, setBusy] = useState(false);
  if (!IS_LOCAL_DEV) return null;
  const on = isDevPaymentEnabled();

  const wipe = async () => {
    setBusy(true);
    try {
      await fetch('/api/dev/reset', { method: 'DELETE' });
    } catch {}
    try {
      const keep = new Set(['bunda_payment_enabled']);
      Object.keys(localStorage)
        .filter((k) => !keep.has(k))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    location.reload();
  };

  return (
    <div
      id="dev-toolbar"
      className="fixed right-3 bottom-3 z-[9999] flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1.5 shadow-lg border border-stone-300"
    >
      <span
        id="dev-db-label"
        className="px-2 text-[10px] font-bold tracking-wider text-[#6B4E2E]"
        title="Data user/tier/order dev disimpan di .dev-db.json (bukan D1 produksi)"
      >
        DB: LOKAL
      </span>
      <button
        type="button"
        id="dev-payment-toggle"
        onClick={() => setDevPaymentEnabled(!on)}
        title={
          on
            ? 'Matikan pembayaran (balik ke maintenance)'
            : 'Nyalakan pembayaran SANDBOX Midtrans (uang bohongan, aman dites berkali-kali)'
        }
        className={`h-[30px] px-3 rounded-full text-[11px] font-bold tracking-wide border transition-colors cursor-pointer ${
          on
            ? 'bg-[#556B2F] text-white border-[#465926] hover:bg-[#465926]'
            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
        }`}
      >
        {on ? 'PAYMENT ON · SANDBOX' : 'PAYMENT OFF'}
      </button>
      <button
        type="button"
        id="dev-wipe-data"
        onClick={wipe}
        disabled={busy}
        title="Hapus .dev-db.json + semua localStorage di origin ini"
        className="h-[30px] px-3 rounded-full text-[11px] font-bold tracking-wide border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
      >
        {busy ? 'Menghapus…' : 'Hapus Semua Data Test Lokal'}
      </button>
    </div>
  );
};
