import { UserProfile } from '../types';

// ============================================================================
// Sumber tunggal struktur buku 100 halaman.
// Dipakai oleh PrintBookStudio (preview) dan PrintBookView (halaman /print),
// supaya preview dan file PDF tidak pernah berbeda urutan/tipe halaman.
// ============================================================================

export type BookSpreadType =
  | 'intro'
  | 'bab1-a'
  | 'bab1-b'
  | 'pembatas-1'
  | 'pembatas-2'
  | 'pembatas-3'
  | 'weekly'
  | 'bab3-a'
  | 'bab3-b'
  | 'bab3-c'
  | 'bab4-a'
  | 'bab4-b'
  | 'bab4-c'
  | 'bab5-a'
  | 'bab5-b';

export interface BookSpreadInfo {
  spreadIndex: number;
  type: BookSpreadType;
  chapterTitle: string;
  week?: number;
  pages: [number, number];
}

export const TOTAL_SPREADS = 50;
export const TOTAL_PAGES = TOTAL_SPREADS * 2;

export type BookTier = 'essential' | 'vip';

/**
 * Rencana halaman per tier.
 * - vip: 50 spread = 100 halaman (aktif sekarang)
 * - essential: 15 spread = 30 halaman (belum dijual, sudah disiapkan)
 */
export function getBookPagePlan(tier: BookTier): { spreads: number; pages: number } {
  const spreads = tier === 'vip' ? TOTAL_SPREADS : 15;
  return { spreads, pages: spreads * 2 };
}

export function getSpreadInfo(spreadIdx: number): BookSpreadInfo {
  const leftPage = spreadIdx * 2 + 1;
  const rightPage = spreadIdx * 2 + 2;
  const pages: [number, number] = [leftPage, rightPage];

  if (spreadIdx === 0) {
    return { spreadIndex: spreadIdx, type: 'intro', chapterTitle: 'Halaman Judul & Pengantar', pages };
  }
  if (spreadIdx === 1) {
    return { spreadIndex: spreadIdx, type: 'bab1-a', chapterTitle: 'Bab 1: Awal Mula Kisah (Test Pack & Reaksi Ayah)', pages };
  }
  if (spreadIdx === 2) {
    return { spreadIndex: spreadIdx, type: 'bab1-b', chapterTitle: 'Bab 1: Awal Mula Kisah (USG Kantung Janin & Ngidam)', pages };
  }
  if (spreadIdx === 3) {
    return { spreadIndex: spreadIdx, type: 'pembatas-1', chapterTitle: 'Pembatas Trimester 1 (Minggu 1 - 13)', pages };
  }
  if (spreadIdx >= 4 && spreadIdx <= 12) {
    const week = 5 + (spreadIdx - 4);
    return { spreadIndex: spreadIdx, type: 'weekly', week, chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${week})`, pages };
  }
  if (spreadIdx === 13) {
    return { spreadIndex: spreadIdx, type: 'pembatas-2', chapterTitle: 'Pembatas Trimester 2 (Minggu 14 - 27)', pages };
  }
  if (spreadIdx >= 14 && spreadIdx <= 27) {
    const week = 14 + (spreadIdx - 14);
    return { spreadIndex: spreadIdx, type: 'weekly', week, chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${week})`, pages };
  }
  if (spreadIdx === 28) {
    return { spreadIndex: spreadIdx, type: 'pembatas-3', chapterTitle: 'Pembatas Trimester 3 (Minggu 28 - 40)', pages };
  }
  if (spreadIdx >= 29 && spreadIdx <= 41) {
    const week = 28 + (spreadIdx - 29);
    return { spreadIndex: spreadIdx, type: 'weekly', week, chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${week})`, pages };
  }
  if (spreadIdx === 42) {
    return { spreadIndex: spreadIdx, type: 'bab3-a', chapterTitle: 'Bab 3: Persiapan (Nama & Kamar)', pages };
  }
  if (spreadIdx === 43) {
    return { spreadIndex: spreadIdx, type: 'bab3-b', chapterTitle: 'Bab 3: Persiapan (Daftar Belanja Bayi)', pages };
  }
  if (spreadIdx === 44) {
    return { spreadIndex: spreadIdx, type: 'bab3-c', chapterTitle: 'Bab 3: Persiapan (Checklist Tas RS)', pages };
  }
  if (spreadIdx === 45) {
    return { spreadIndex: spreadIdx, type: 'bab4-a', chapterTitle: 'Bab 4: Kelahiran (Hari Persalinan)', pages };
  }
  if (spreadIdx === 46) {
    return { spreadIndex: spreadIdx, type: 'bab4-b', chapterTitle: 'Bab 4: Kelahiran (Biodata & Cap Kaki)', pages };
  }
  if (spreadIdx === 47) {
    return { spreadIndex: spreadIdx, type: 'bab4-c', chapterTitle: 'Bab 4: Kelahiran (Gelang RS & Foto)', pages };
  }
  if (spreadIdx === 48) {
    return { spreadIndex: spreadIdx, type: 'bab5-a', chapterTitle: 'Bab 5: Kapsul Waktu (Surat Bunda)', pages };
  }
  return { spreadIndex: spreadIdx, type: 'bab5-b', chapterTitle: 'Bab 5: Kapsul Waktu (Surat Ayah)', pages };
}

// ---------------------------------------------------------------------------
// Nama file PDF: "Bunda Journal - Bunda {namaIbu} - {namaAnak} - {YYYY-MM-DD}"
// Karakter yang dilarang filesystem Android/iOS dibersihkan.
// ---------------------------------------------------------------------------
export function sanitizeFilePart(value: string): string {
  return String(value || '')
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildBookFileName(
  profile: Pick<UserProfile, 'name' | 'babyNickname'> | null | undefined,
  date: Date = new Date()
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const ibu = sanitizeFilePart(profile?.name || '');
  const anak = sanitizeFilePart(profile?.babyNickname || '');

  const parts = ['Bunda Journal'];
  if (ibu) parts.push(`Bunda ${ibu}`);
  if (anak) parts.push(anak);
  parts.push(stamp);

  return parts.join(' - ');
}
