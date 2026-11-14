import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BOOK_THEMES, BookThemeConfig, BookThemeId } from '../../types/bookPrint';
import { UserProfile, PhotoMemory, JournalEntry } from '../../types';
import { buildBookFileName, getSpreadInfo, getVisibleSpreadCount, type BookTier } from '../../lib/bookPages';
import { shrinkPhotos } from '../../lib/imageResize';
import { IntroPages } from './pages/IntroPages';
import { Bab1AwalMula } from './pages/Bab1AwalMula';
import { PembatasTrimester } from './pages/PembatasTrimester';
import { WeeklyJournalSpread } from './pages/WeeklyJournalSpread';
import { Bab3Persiapan } from './pages/Bab3Persiapan';
import { Bab4Kelahiran } from './pages/Bab4Kelahiran';
import { Bab5KapsulWaktu } from './pages/Bab5KapsulWaktu';
import { isMediaKey, mediaGet } from '../../lib/mediaStore';

// ============================================================================
// Halaman /print — dipakai untuk flow: Jurnal > Download > browser > print > simpan PDF.
//
// Kenapa halaman terpisah:
// 1. Tidak ada UI aplikasi (header, drawer, tombol) yang ikut tercetak.
// 2. Ukuran halaman A4 asli (210 x 297 mm), tidak di-scale — engine print browser
//    yang mengubahnya jadi PDF vector, jadi hasilnya identik dengan yang tampil.
// 3. Tidak ada render ulang HTML → tidak ada raster 100 halaman (yang bikin 4 jam).
// ============================================================================

const THEME_STORAGE_KEY = 'bunda_book_theme';
const PROFILE_KEY = 'bunda_profile';
const PHOTOS_KEY = 'bunda_photos';
const ENTRIES_KEY = 'bunda_entries';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = isMediaKey(key) ? mediaGet(key) : localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function resolveTheme(): BookThemeConfig {
  const stored = readJSON<string>(THEME_STORAGE_KEY, 'kinfolk-sage');
  const theme = BOOK_THEMES[stored as BookThemeId];
  return theme || BOOK_THEMES['kinfolk-sage'];
}

/** iOS/iPadOS butuh tap user untuk print, dan tidak boleh auto-close tab. */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

const PrintBookView: React.FC = () => {
  const theme = useMemo(resolveTheme, []);
  const profile = useMemo(() => readJSON<UserProfile>(PROFILE_KEY, {} as UserProfile), []);
  const entries = useMemo(() => readJSON<JournalEntry[]>(ENTRIES_KEY, []), []);
  const [photos, setPhotos] = useState<PhotoMemory[]>(() => readJSON<PhotoMemory[]>(PHOTOS_KEY, []));
  const [ready, setReady] = useState(false);
  const printedRef = useRef(false);

  const fileName = useMemo(() => buildBookFileName(profile), [profile]);
  // Gate tier: default mati (ESSENTIAL_GATE_ENABLED=false) → selalu 100 halaman.
  const plan = useMemo(() => {
    let tier: BookTier = 'vip';
    try {
      if (localStorage.getItem('bunda_user_tier') === 'essential') tier = 'essential';
    } catch {}
    const spreadCount = getVisibleSpreadCount(tier);
    return { spreads: spreadCount, pages: spreadCount * 2 };
  }, []);
  const spreads = useMemo(() => Array.from({ length: plan.spreads }, (_, i) => i), [plan.spreads]);

  const customPhotos = useMemo(() => {
    const map: Record<number, PhotoMemory> = {};
    photos.forEach((p) => {
      if (p && typeof p.week === 'number') map[p.week] = p;
    });
    return map;
  }, [photos]);

  // Nama file default pada dialog "Save as PDF" diambil browser dari document.title.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = fileName;
    document.documentElement.classList.add('print-book-mode');
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove('print-book-mode');
    };
  }, [fileName]);

  // Perkecil foto berat sebelum dicetak (kualitas cetak tetap, waktu print turun).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shrunk = await shrinkPhotos(photos);
      if (!cancelled && shrunk !== photos) setPhotos(shrunk);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tunggu font + semua gambar selesai, baru anggap siap cetak.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.ready;
      } catch {}
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );
      // beri 1 frame + jeda kecil supaya layout final
      await new Promise((r) => setTimeout(r, 350));
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  // Auto-print: Android & desktop. iOS tetap lewat tombol (WebKit memblokir print non-gesture).
  useEffect(() => {
    if (!ready || printedRef.current || isIOS()) return;
    printedRef.current = true;
    try {
      window.print();
    } catch {}
  }, [ready]);

  // Setelah dialog print selesai, tutup tab (hanya kalau tab dibuka oleh aplikasi).
  useEffect(() => {
    const handleAfterPrint = () => {
      if (isIOS()) return;
      try {
        if (window.opener && !window.opener.closed) window.close();
      } catch {}
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const renderSpread = (spreadIdx: number) => {
    const info = getSpreadInfo(spreadIdx);
    const [leftNum, rightNum] = info.pages;

    switch (info.type) {
      case 'intro':
        return <IntroPages theme={theme} userProfile={profile} isFillMode={false} />;
      case 'bab1-a':
        return <Bab1AwalMula theme={theme} userProfile={profile} photos={photos} isFillMode={false} spreadIndex={0} />;
      case 'bab1-b':
        return <Bab1AwalMula theme={theme} userProfile={profile} photos={photos} isFillMode={false} spreadIndex={1} />;
      case 'pembatas-1':
        return <PembatasTrimester trimester={1} theme={theme} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'pembatas-2':
        return <PembatasTrimester trimester={2} theme={theme} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'pembatas-3':
        return <PembatasTrimester trimester={3} theme={theme} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'weekly': {
        const week = info.week || 12;
        const matchedEntry = entries.find((e) => e.week === week);
        return (
          <WeeklyJournalSpread
            key={`weekly-${week}`}
            week={week}
            theme={theme}
            leftPageNum={leftNum}
            rightPageNum={rightNum}
            journalEntry={matchedEntry}
            photo={customPhotos[week]}
            isFillMode={false}
          />
        );
      }
      case 'bab3-a':
        return <Bab3Persiapan theme={theme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'bab3-b':
        return <Bab3Persiapan theme={theme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'bab3-c':
        return <Bab3Persiapan theme={theme} spreadIndex={2} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={false} />;
      case 'bab4-a':
        return <Bab4Kelahiran theme={theme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={profile} isFillMode={false} />;
      case 'bab4-b':
        return <Bab4Kelahiran theme={theme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={profile} isFillMode={false} />;
      case 'bab4-c':
        return <Bab4Kelahiran theme={theme} spreadIndex={2} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={profile} isFillMode={false} />;
      case 'bab5-a':
        return <Bab5KapsulWaktu theme={theme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={profile} isFillMode={false} />;
      case 'bab5-b':
      default:
        return <Bab5KapsulWaktu theme={theme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={profile} isFillMode={false} />;
    }
  };

  return (
    <div className="print-book-root">
      {/* Instruksi + tombol fallback. Tidak ikut tercetak. */}
      <div className="print-book-toolbar">
        <div className="print-book-toolbar-inner">
          <div>
            <p className="print-book-toolbar-title">Buku siap disimpan</p>
            <p className="print-book-toolbar-sub">
              Pada dialog berikut pilih <strong>Save as PDF</strong> / <strong>Simpan sebagai PDF</strong>, lalu Save.
            </p>
          </div>
          <div className="print-book-toolbar-actions">
            <button type="button" className="print-book-btn print-book-btn-primary" onClick={() => window.print()}>
              Simpan PDF
            </button>
            {!isIOS() && (
              <button type="button" className="print-book-btn" onClick={() => window.close()}>
                Tutup
              </button>
            )}
          </div>
        </div>
        {!ready && <p className="print-book-toolbar-loading">Menyiapkan {plan.pages} halaman…</p>}
      </div>

      <div className="print-book-pages">
        {spreads.map((sIdx) => (
          <div className="print-book-spread" key={sIdx}>
            {renderSpread(sIdx)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBookView;
