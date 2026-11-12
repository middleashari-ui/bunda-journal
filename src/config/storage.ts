// ============================================================================
// MODE PENYIMPANAN DATA
//
// 'local'  = USP Bunda Journal: isi jurnal HANYA ada di perangkat user.
//            Tidak ada push/pull ke D1. Backup opsional ke Google Drive user.
// 'cloud'  = mode lama (sinkron ke D1). Disimpan sebagai opsi, tidak dipakai.
//
// Yang tetap ke server hanya data AKUN: email, password hash, tier, order.
// ============================================================================

export type JournalStorageMode = 'local' | 'cloud';

export const JOURNAL_STORAGE_MODE: JournalStorageMode = 'local';

export function isJournalLocalOnly(): boolean {
  return JOURNAL_STORAGE_MODE === 'local';
}
