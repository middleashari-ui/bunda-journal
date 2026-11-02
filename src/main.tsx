import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HealthDataProvider } from './context/HealthDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Auto-purge known dummy/test data from older builds (one-time, safe)
try {
  const DUMMY_PATTERNS = [
    'Sabtu, 14 Septembe', '06:15 Pagi', 'Tangan bunda gemetar',
    'Jessica Anindya', 'Kulit hangatmu',
    'Semangka Mini', 'Rayyan Al-Fatih', 'Kinanti Ayudia',
    'Malik Ibrahim', 'Nayla Salsabila',
  ];
  ['bunda_bab1', 'bunda_bab3', 'bunda_bab4', 'bunda_bab5'].forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw && DUMMY_PATTERNS.some((p) => raw.includes(p))) {
      localStorage.removeItem(key);
    }
  });
} catch {}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="Terjadi Kendala Sistem Bunda Journal">
    <HealthDataProvider>
      <App />
    </HealthDataProvider>
  </ErrorBoundary>
);

// Register modern Service Worker for PWA Offline-First
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

