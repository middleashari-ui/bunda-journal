import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HealthDataProvider } from './context/HealthDataContext';

createRoot(document.getElementById('root')!).render(
  <HealthDataProvider>
    <App />
  </HealthDataProvider>
);

// Unregister and clear all stale service workers completely
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

