import { PhotoMemory } from '../types';

// ============================================================================
// Kompresi foto untuk halaman cetak.
// Tujuan: print 100 halaman tetap 10–15 detik, TANPA menurunkan kualitas visual.
// - Sisi terpanjang maksimum 1600 px  → area foto A4 (±120 mm) butuh ±1417 px @300dpi,
//   jadi 1600 px masih di atas kebutuhan cetak.
// - JPEG q0.85, orientasi EXIF dihormati.
// - File di bawah 700 KB dilewati (tidak perlu dikompres, kualitas tetap asli).
// ============================================================================

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;
const SKIP_BELOW_BYTES = 700 * 1024;

function dataUrlBytes(src: string): number {
  if (!src.startsWith('data:')) return 0;
  const comma = src.indexOf(',');
  if (comma < 0) return 0;
  return Math.floor((src.length - comma) * 0.75);
}

async function loadSource(src: string): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    if (typeof createImageBitmap === 'function') {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode-failed'));
      img.src = url;
    });
    return img;
  } catch {
    return null;
  }
}

/**
 * Kembalikan data URL yang sudah diperkecil. Kalau gagal / tidak perlu, kembalikan src asli.
 */
export async function shrinkImageSource(src: string): Promise<string> {
  if (!src) return src;
  // Hanya proses data URL / blob lokal. URL remote dibiarkan (bisa kena CORS).
  if (!src.startsWith('data:') && !src.startsWith('blob:')) return src;

  const source = await loadSource(src);
  if (!source) return src;

  const width = 'width' in source ? source.width : 0;
  const height = 'height' in source ? source.height : 0;
  if (!width || !height) return src;

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  // Sudah kecil secara dimensi DAN ringan: biarkan asli (hindari kompresi ganda).
  if (scale >= 1 && dataUrlBytes(src) <= SKIP_BELOW_BYTES) return src;

  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);

  if ('close' in source && typeof source.close === 'function') source.close();

  try {
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    return src;
  }
}

/**
 * Versi massal: hanya memproses foto yang berat. Urutan & metadata lain dipertahankan.
 */
export async function shrinkPhotos(photos: PhotoMemory[]): Promise<PhotoMemory[]> {
  let changed = false;
  const next: PhotoMemory[] = [];

  for (const photo of photos) {
    const original = photo?.src || '';
    if (!original) {
      next.push(photo);
      continue;
    }
    const shrunk = await shrinkImageSource(original);
    if (shrunk !== original) {
      changed = true;
      next.push({ ...photo, src: shrunk });
    } else {
      next.push(photo);
    }
  }

  return changed ? next : photos;
}
