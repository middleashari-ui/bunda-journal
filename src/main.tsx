import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HealthDataProvider } from './context/HealthDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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

