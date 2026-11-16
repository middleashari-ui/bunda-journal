import {createRoot} from 'react-dom/client';
import { lazy, Suspense } from 'react';
import App from './App.tsx';
import './index.css';
import { HealthDataProvider } from './context/HealthDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevToolbar } from './components/DevToolbar';
import { migrateLocalStorage } from './lib/schemaMigration';
import { hydrateMedia } from './lib/mediaStore';
import { installErrorLogging } from './lib/errorLog';

// Ruang Iklan (/ads) dimuat terpisah supaya user PWA tidak membayar bundle-nya.
const AdsApp = lazy(() => import('./ads/AdsApp'));
const isAdsRoute =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/ads' || window.location.pathname.startsWith('/ads/'));

// Migrasi skema data lokal (mis. index hari Rab=0 -> Sen=0) SEBELUM React
// membaca localStorage. Idempoten lewat `bunda_schema_version`.
migrateLocalStorage();
installErrorLogging();

// P0.7: migrasi dummy satu-kali bertanda (bukan purge tiap boot).
// - Hanya jalan sekali (flag bunda_dummy_purge_v1).
// - Backup item yang dihapus ke bunda_dummy_backup_v1.
// - JANGAN hapus jika mengandung data valid (Semangka Mini / Minggu 39 / W39).
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('bunda_dummy_purge_v1') !== 'done') {
    // 'Semangka Mini' SENGAJA tidak ada di pola dummy: itu nama buah valid Minggu 39.
    const DUMMY_PATTERNS = [
      'Jessica Anindya', 'Kulit hangatmu',
      'Rayyan Al-Fatih', 'Kinanti Ayudia',
      'Malik Ibrahim', 'Nayla Salsabila',
      'Kalandra', 'Atharrazka', 'dr. Anita', 'dr Anita',
      '14 Sep', '14 September',
      '06:15', '142 bpm', 'Si Kecil 18 Mei',
    ];
    const isValidContent = (raw: string) => {
      if (raw.includes('Semangka Mini')) return true;
      if (/W39|Minggu 39|minggu 39/i.test(raw)) return true;
      if (/"week"\s*:\s*39\b/.test(raw)) return true;
      return false;
    };
    // 'bunda_appointment' & 'bunda_catatan_ayah' SENGAJA tidak dipurge:
    // itu jadwal milik user (per-user key, lihat lib/appointmentStore.ts).
    const backup: Record<string, string> = {};
    ['bunda_bab1', 'bunda_bab3', 'bunda_bab4', 'bunda_bab5', 'bunda_jadwal_usg'].forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        if (isValidContent(raw)) return;
        if (DUMMY_PATTERNS.some((p) => raw.includes(p))) {
          backup[key] = raw;
          localStorage.removeItem(key);
        }
      } catch {}
    });
    try {
      if (Object.keys(backup).length > 0) {
        localStorage.setItem(
          'bunda_dummy_backup_v1',
          JSON.stringify({ at: new Date().toISOString(), items: backup })
        );
      }
    } catch {}
    try {
      localStorage.setItem('bunda_dummy_purge_v1', 'done');
    } catch {}
  }
} catch {}

// Hydrate media (foto & bab buku) dari IndexedDB SEBELUM render, supaya
// komponen tetap bisa membaca `mediaGet()` secara sinkron.
const root = createRoot(document.getElementById('root')!);

if (isAdsRoute) {
  root.render(
    <ErrorBoundary fallbackTitle="Ruang Iklan mengalami kendala">
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              display: 'grid',
              placeItems: 'center',
              background: '#F5F2EB',
              color: '#556B2F',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
            }}
          >
            Memuat Ruang Iklan…
          </div>
        }
      >
        <AdsApp />
      </Suspense>
    </ErrorBoundary>
  );
} else {
  hydrateMedia().finally(() => {
    root.render(
      <ErrorBoundary fallbackTitle="Terjadi Kendala Sistem Bunda Journal">
        <HealthDataProvider>
          <App />
          <DevToolbar />
        </HealthDataProvider>
      </ErrorBoundary>
    );
  });
}

// Register modern Service Worker for PWA Offline-First
// Ruang Iklan sengaja tidak memakai service worker consumer.
if (!isAdsRoute && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Paksa cek versi baru tiap load supaya tablet/HP tidak nyangkut di cache lama
        reg.update().catch(() => {});
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (nw) {
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage('SKIP_WAITING');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

