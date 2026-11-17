// Notification and audio reminder helper for Bunda app

const NOTIFICATION_ICON = '/icon-192-v2.png';
const NOTIFICATION_BADGE = '/icon-192-v2.png';

export const playGentleChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create gentle warm dual tone (soft chime)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.4); // C6

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.85);
    osc2.stop(ctx.currentTime + 0.85);
  } catch {
    // AudioContext might be restricted until user gesture; fails gracefully
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export interface SystemNotificationOptions {
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Tampilkan notifikasi sistem.
 * Di Android, `new Notification()` sering diabaikan; service worker
 * `showNotification()` lebih andal dan mendukung ikon/logo aplikasi.
 */
export const sendSystemNotification = async (
  title: string,
  body: string,
  options: SystemNotificationOptions = {}
): Promise<boolean> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const payload: NotificationOptions = {
    body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: options.tag || 'bunda-reminder',
    data: { url: options.url || '/' },
    requireInteraction: options.requireInteraction ?? false,
    silent: options.silent ?? false,
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, payload);
      return true;
    }
  } catch {
    // fallback di bawah
  }

  try {
    new Notification(title, payload);
    return true;
  } catch {
    return false;
  }
};
