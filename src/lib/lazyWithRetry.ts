import React from 'react';

/**
 * `React.lazy` dengan satu kali percobaan ulang.
 *
 * Chunk JS bisa gagal diunduh sesaat (sinyal HP jelek, dev server restart,
 * service worker transisi). Tanpa retry, layar langsung jatuh ke ErrorBoundary
 * padahal sekadar perlu mengulang unduhan.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((error) => {
      console.warn('[lazy] gagal memuat chunk, mencoba sekali lagi', error);
      return new Promise<{ default: T }>((resolve) => {
        setTimeout(resolve, 600);
      }).then(factory);
    })
  );
}
