import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookThemeId, 
  BOOK_THEMES, 
  BOOK_CHAPTERS 
} from '../../types/bookPrint';
import { UserProfile, PhotoMemory, JournalEntry } from '../../types';
import { IntroPages } from './pages/IntroPages';
import { Bab1AwalMula } from './pages/Bab1AwalMula';
import { PembatasTrimester } from './pages/PembatasTrimester';
import { WeeklyJournalSpread } from './pages/WeeklyJournalSpread';
import { Bab3Persiapan } from './pages/Bab3Persiapan';
import { Bab4Kelahiran } from './pages/Bab4Kelahiran';
import { Bab5KapsulWaktu } from './pages/Bab5KapsulWaktu';
import { 
  Palette, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  X, 
  Layers, 
  FileText, 
  Menu, 
  ChevronUp, 
  Maximize2, 
  Download, 
  Search, 
  Lock, 
  Unlock, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RotateCcw, 
  ExternalLink,
  BookMarked
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { JournalPdfDocument, PdfBookPageData } from '../../utils/JournalPdfDocument';
import { generatePDF, exportPagesListToB5PDF, extractPagesFromContainer, PDFExportProgress } from '../../utils/pdfGenerator';

interface PrintBookStudioProps {
  userProfile: UserProfile;
  photos: PhotoMemory[];
  pastEntries: JournalEntry[];
  currentWeek: number;
  onUpdatePhoto?: (w: number, newPhoto: PhotoMemory) => void;
  onClose: () => void;
  onGoToJournal?: () => void;
}

interface EmptyPageItem {
  pageNum: number;
  spreadIndex: number;
  side: 'left' | 'right';
  chapter: string;
  description: string;
}

export const PrintBookStudio: React.FC<PrintBookStudioProps> = ({
  userProfile,
  photos,
  pastEntries,
  currentWeek,
  onUpdatePhoto,
  onClose,
  onGoToJournal,
}) => {
  // Theme state
  const [selectedThemeId, setSelectedThemeId] = useState<BookThemeId>('kinfolk-sage');
  const activeTheme = BOOK_THEMES[selectedThemeId];

  // Navigation / Scroll Tracking state (0 to 49 spreads = 100 pages)
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);

  // Document Lock state (Mode Jurnal: Terkunci / Read-Only vs Mode Edit)
  const [isDocumentLocked, setIsDocumentLocked] = useState<boolean>(() => {
    return localStorage.getItem('bunda_book_locked') === 'true';
  });
  const [lockToast, setLockToast] = useState<{ message: string; isLocked: boolean } | null>(null);
  const lockToastTimeoutRef = useRef<number | null>(null);

  const toggleDocumentLock = () => {
    setIsDocumentLocked(prev => {
      const next = !prev;
      if (lockToastTimeoutRef.current) {
        window.clearTimeout(lockToastTimeoutRef.current);
      }
      setLockToast({
        message: next ? 'Dokumen Terkunci (Mode Baca)' : 'Mode Edit Aktif (Bisa Mengetik)',
        isLocked: next
      });
      lockToastTimeoutRef.current = window.setTimeout(() => {
        setLockToast(null);
      }, 3000);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (lockToastTimeoutRef.current) {
        window.clearTimeout(lockToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('bunda_book_locked', String(isDocumentLocked));
  }, [isDocumentLocked]);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  // Standard B5 Dimensions at 96 DPI (176mm x 250mm)
  const B5_WIDTH_PX = 665.2;
  const B5_HEIGHT_PX = 944.9;

  const mainContainerRef = useRef<HTMLElement>(null);
  
  // Viewport width detection for 100% responsive scaling (320px - 430px)
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 390;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 390;
      setViewportWidth(w);
      setIsMobile(w <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic responsive paper width:
  // On mobile (<=768px): lebar pas layar smartphone dengan padding minimal 12px kiri-kanan
  // sehingga terlihat jelas dan pas di layar smartphone tanpa kekecilan
  const pageDisplayWidth = isMobile 
    ? Math.min(viewportWidth - 24, 420)
    : Math.min(540, Math.round(viewportWidth * 0.85));

  const pageScale = Number((pageDisplayWidth / B5_WIDTH_PX).toFixed(4));
  const pageGapUnscaled = Math.round(20 / (pageScale || 0.55));
  const unscaledSpreadHeight = B5_HEIGHT_PX * 2 + pageGapUnscaled;
  const scaledSpreadHeight = Math.round(unscaledSpreadHeight * pageScale);

  const [customPhotos, setCustomPhotos] = useState<Record<number, PhotoMemory>>({});
  
  // Drawer / Hamburger modal states
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBottomChapterOpen, setIsBottomChapterOpen] = useState<boolean>(false);

  // Search in Drawer
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scan Halaman Kosong state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);
  const [emptyPagesList, setEmptyPagesList] = useState<EmptyPageItem[]>([]);

  // PDF Download Modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // PDF generation state (html-to-image + jsPDF)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);

  const handleOpenPrintWindow = () => {
    // Solusi Anti-Blank & Anti-Popup Blocker:
    // Gunakan Hidden Iframe untuk mencetak dokumen B5 mandiri.
    // Cara ini:
    // 1. Tidak diblokir browser HP (bukan window.open pop-up).
    // 2. Terisolasi total dari DOM utama PWA sehingga tidak akan pernah blank putih.
    // 3. Merender seluruh 100 halaman lengkap dengan CSS Anti-Geser B5.
    const existingIframe = document.getElementById('bunda-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bunda-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n');

    const pagesHtml: string[] = [];
    for (let i = 0; i < 50; i++) {
      const spreadEl = document.getElementById(`spread-row-${i}`);
      if (spreadEl) {
        const pages = spreadEl.querySelectorAll('.b5-page-left, .b5-page-right, .b5-page');
        pages.forEach((p) => {
          pagesHtml.push(p.outerHTML);
        });
      }
    }

    const docContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bunda-Journal-100-Halaman</title>
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      -webkit-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    .b5-page, .halaman-jurnal {
      position: relative !important;
      width: 210mm !important;
      max-width: 210mm !important;
      min-width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      min-height: 297mm !important;
      padding: 20mm !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .bingkai-usg img, .aspect-\\[4\\/3\\] img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
    }
  </style>
</head>
<body>
  ${pagesHtml.join('\n')}
</body>
</html>`;

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(docContent);
      iframeDoc.close();

      iframe.contentWindow?.focus();
      // Tunggu font dan gambar ter-render sempurna
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 500);
    }
  };

  // Bottom navigation bar helpers
  const handleNavigateSpread = (idx: number) => {
    const target = Math.max(0, Math.min(49, idx));
    setCurrentSpreadIndex(target);
    const el = document.getElementById(`spread-row-${target}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleChapterSelect = (chapterId: string) => {
    const found = BOOK_CHAPTERS.find(c => c.id === chapterId);
    if (found) {
      const startSpread = Math.floor((found.pageStart - 1) / 2);
      handleNavigateSpread(startSpread);
    }
  };

  const getCurrentChapterId = () => {
    const curPage = currentSpreadIndex * 2 + 1;
    const found = BOOK_CHAPTERS.find(c => curPage >= c.pageStart && curPage <= c.pageEnd);
    return found ? found.id : BOOK_CHAPTERS[0].id;
  };

  // Synchronize currentSpreadIndex with natural finger scroll
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const rowHeightWithMargin = scaledSpreadHeight + 24;
    if (rowHeightWithMargin > 0) {
      const estimatedIndex = Math.min(49, Math.max(0, Math.round(scrollTop / rowHeightWithMargin)));
      if (estimatedIndex !== currentSpreadIndex) {
        setCurrentSpreadIndex(estimatedIndex);
      }
    }
  };

  const handleUpdatePhoto = (w: number, newPhoto: PhotoMemory) => {
    setCustomPhotos(prev => ({ ...prev, [w]: newPhoto }));
    if (onUpdatePhoto) {
      onUpdatePhoto(w, newPhoto);
    }
    try {
      const savedPhotosStr = localStorage.getItem('bunda_photos');
      let currentList: PhotoMemory[] = savedPhotosStr ? JSON.parse(savedPhotosStr) : [];
      currentList = currentList.filter(p => p.week !== w);
      currentList.push(newPhoto);
      localStorage.setItem('bunda_photos', JSON.stringify(currentList));
      window.dispatchEvent(new Event('bunda_journal_updated'));
    } catch {}
  };

  const getSpreadInfo = (spreadIdx: number) => {
    const leftPage = spreadIdx * 2 + 1;
    const rightPage = spreadIdx * 2 + 2;

    if (spreadIdx === 0) {
      return {
        type: 'intro',
        chapterTitle: 'Halaman Judul & Pengantar',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 1) {
      return {
        type: 'bab1-a',
        chapterTitle: 'Bab 1: Awal Mula Kisah (Test Pack & Reaksi Ayah)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 2) {
      return {
        type: 'bab1-b',
        chapterTitle: 'Bab 1: Awal Mula Kisah (USG Kantung Janin & Ngidam)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 3) {
      return {
        type: 'pembatas-1',
        chapterTitle: 'Pembatas Trimester 1 (Minggu 1 - 13)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx >= 4 && spreadIdx <= 12) {
      const weekNum = 5 + (spreadIdx - 4);
      return {
        type: 'weekly',
        week: weekNum,
        chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${weekNum})`,
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 13) {
      return {
        type: 'pembatas-2',
        chapterTitle: 'Pembatas Trimester 2 (Minggu 14 - 27)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx >= 14 && spreadIdx <= 27) {
      const weekNum = 14 + (spreadIdx - 14);
      return {
        type: 'weekly',
        week: weekNum,
        chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${weekNum})`,
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 28) {
      return {
        type: 'pembatas-3',
        chapterTitle: 'Pembatas Trimester 3 (Minggu 28 - 40)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx >= 29 && spreadIdx <= 41) {
      const weekNum = 28 + (spreadIdx - 29);
      return {
        type: 'weekly',
        week: weekNum,
        chapterTitle: `Bab 2: Jurnal Kehamilan (Week ${weekNum})`,
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 42) {
      return {
        type: 'bab3-a',
        chapterTitle: 'Bab 3: Persiapan (Nama & Kamar)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 43) {
      return {
        type: 'bab3-b',
        chapterTitle: 'Bab 3: Persiapan (Daftar Belanja Bayi)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 44) {
      return {
        type: 'bab3-c',
        chapterTitle: 'Bab 3: Persiapan (Checklist Tas RS)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 45) {
      return {
        type: 'bab4-a',
        chapterTitle: 'Bab 4: Kelahiran (Hari Persalinan)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 46) {
      return {
        type: 'bab4-b',
        chapterTitle: 'Bab 4: Kelahiran (Biodata & Cap Kaki)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 47) {
      return {
        type: 'bab4-c',
        chapterTitle: 'Bab 4: Kelahiran (Gelang RS & Foto)',
        pages: [leftPage, rightPage],
      };
    }
    if (spreadIdx === 48) {
      return {
        type: 'bab5-a',
        chapterTitle: 'Bab 5: Kapsul Waktu (Surat Bunda)',
        pages: [leftPage, rightPage],
      };
    }
    return {
      type: 'bab5-b',
      chapterTitle: 'Bab 5: Kapsul Waktu (Surat Ayah)',
      pages: [leftPage, rightPage],
    };
  };

  // Memoized 50 spreads / 100 pages data for @react-pdf/renderer
  const bookPages: PdfBookPageData[] = useMemo(() => {
    return Array.from({ length: 50 }).map((_, sIdx) => {
      const info = getSpreadInfo(sIdx);
      return {
        spreadIndex: sIdx,
        leftPageNum: info.pages[0],
        rightPageNum: info.pages[1],
        type: info.type,
        chapterTitle: info.chapterTitle,
        week: info.week,
      };
    });
  }, []);

  const renderSpreadContent = (spreadIdx: number) => {
    const info = getSpreadInfo(spreadIdx);
    const leftNum = info.pages[0];
    const rightNum = info.pages[1];

    if (info.type === 'intro') {
      return <IntroPages theme={activeTheme} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab1-a') {
      return <Bab1AwalMula theme={activeTheme} userProfile={userProfile} photos={photos} isFillMode={!isDocumentLocked} spreadIndex={0} />;
    }
    if (info.type === 'bab1-b') {
      return <Bab1AwalMula theme={activeTheme} userProfile={userProfile} photos={photos} isFillMode={!isDocumentLocked} spreadIndex={1} />;
    }
    if (info.type === 'pembatas-1') {
      return <PembatasTrimester trimester={1} theme={activeTheme} leftPageNum={leftNum} rightPageNum={rightNum} />;
    }
    if (info.type === 'pembatas-2') {
      return <PembatasTrimester trimester={2} theme={activeTheme} leftPageNum={leftNum} rightPageNum={rightNum} />;
    }
    if (info.type === 'pembatas-3') {
      return <PembatasTrimester trimester={3} theme={activeTheme} leftPageNum={leftNum} rightPageNum={rightNum} />;
    }
    if (info.type === 'weekly') {
      const w = info.week || 12;
      const matchedEntry = pastEntries.find(e => e.week === w);
      let matchedPhoto = customPhotos[w] || photos.find(p => p.week === w);
      if (!matchedPhoto) {
        try {
          const savedStr = localStorage.getItem('bunda_photos');
          if (savedStr) {
            const list: PhotoMemory[] = JSON.parse(savedStr);
            const found = list.find(p => p.week === w);
            if (found) matchedPhoto = found;
          }
        } catch {}
      }
      return (
        <WeeklyJournalSpread 
          key={`weekly-spread-${w}`}
          week={w}
          theme={activeTheme}
          leftPageNum={leftNum}
          rightPageNum={rightNum}
          journalEntry={matchedEntry}
          photo={matchedPhoto}
          isFillMode={!isDocumentLocked}
          onUpdatePhoto={handleUpdatePhoto}
        />
      );
    }
    if (info.type === 'bab3-a') {
      return <Bab3Persiapan theme={activeTheme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab3-b') {
      return <Bab3Persiapan theme={activeTheme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab3-c') {
      return <Bab3Persiapan theme={activeTheme} spreadIndex={2} leftPageNum={leftNum} rightPageNum={rightNum} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab4-a') {
      return <Bab4Kelahiran theme={activeTheme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab4-b') {
      return <Bab4Kelahiran theme={activeTheme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab4-c') {
      return <Bab4Kelahiran theme={activeTheme} spreadIndex={2} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
    }
    if (info.type === 'bab5-a') {
      return <Bab5KapsulWaktu theme={activeTheme} spreadIndex={0} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
    }
    return <Bab5KapsulWaktu theme={activeTheme} spreadIndex={1} leftPageNum={leftNum} rightPageNum={rightNum} userProfile={userProfile} isFillMode={!isDocumentLocked} />;
  };



  // Scan Halaman Belum Terisi Function
  const handleScanEmptyPages = () => {
    setIsScanning(true);
    const empty: EmptyPageItem[] = [];

    // 1. Cover / Pengantar (Pages 1-2)
    if (!userProfile.name || userProfile.name.trim() === '') {
      empty.push({ pageNum: 1, spreadIndex: 0, side: 'left', chapter: 'Pengantar', description: 'Nama Bunda pada halaman judul belum diisi' });
    }

    // 2. Bab 1: Awal Mula Kisah (Pages 3-6)
    let bab1Data: any = null;
    try {
      const s = localStorage.getItem('bunda_bab1');
      if (s) bab1Data = JSON.parse(s);
    } catch {}

    if (!bab1Data?.testPackPhoto) {
      empty.push({ pageNum: 3, spreadIndex: 1, side: 'left', chapter: 'Bab 1', description: 'Foto Test Pack pertama belum ditempel' });
    }
    if (!bab1Data?.fatherReaction || bab1Data.fatherReaction.trim() === '') {
      empty.push({ pageNum: 4, spreadIndex: 1, side: 'right', chapter: 'Bab 1', description: 'Catatan reaksi Ayah saat garis dua belum ditulis' });
    }
    if (!bab1Data?.usgKantungPhoto) {
      empty.push({ pageNum: 5, spreadIndex: 2, side: 'left', chapter: 'Bab 1', description: 'Foto USG kantung janin trimester 1 belum ditempel' });
    }
    if (!bab1Data?.cravings || bab1Data.cravings.trim() === '') {
      empty.push({ pageNum: 6, spreadIndex: 2, side: 'right', chapter: 'Bab 1', description: 'Daftar ngidam & pantangan belum dicatat' });
    }

    // 3. Bab 2: Weekly Spreads (Weeks 5 to 40 -> spreads 4 to 41, pages 9 to 84)
    for (let spreadIdx = 4; spreadIdx <= 41; spreadIdx++) {
      if (spreadIdx === 13 || spreadIdx === 28) continue;
      
      let weekNum = 5;
      if (spreadIdx >= 4 && spreadIdx <= 12) weekNum = 5 + (spreadIdx - 4);
      else if (spreadIdx >= 14 && spreadIdx <= 27) weekNum = 14 + (spreadIdx - 14);
      else if (spreadIdx >= 29 && spreadIdx <= 41) weekNum = 28 + (spreadIdx - 29);

      const leftPage = spreadIdx * 2 + 1;
      const rightPage = spreadIdx * 2 + 2;

      // Check Left Page (Tracker / Journal notes)
      let hasDailyText = false;
      try {
        const dailySaved = localStorage.getItem(`bunda_daily_w${weekNum}`);
        if (dailySaved) {
          const parsed = JSON.parse(dailySaved);
          if (Object.values(parsed).some(v => typeof v === 'string' && (v as string).trim().length > 0)) {
            hasDailyText = true;
          }
        }
      } catch {}

      const hasPastEntry = pastEntries.some(e => e.week === weekNum && e.text && e.text.trim().length > 0);
      if (!hasDailyText && !hasPastEntry) {
        empty.push({
          pageNum: leftPage,
          spreadIndex: spreadIdx,
          side: 'left',
          chapter: `Bab 2 (Week ${weekNum})`,
          description: `Catatan jurnal harian Minggu ke-${weekNum} belum terisi`
        });
      }

      // Check Right Page (Photo USG / Baby bump)
      let hasPhoto = !!customPhotos[weekNum] || photos.some(p => p.week === weekNum && p.src);
      if (!hasPhoto) {
        try {
          const savedStr = localStorage.getItem('bunda_photos');
          if (savedStr) {
            const list: PhotoMemory[] = JSON.parse(savedStr);
            if (list.some(p => p.week === weekNum && p.src)) hasPhoto = true;
          }
        } catch {}
      }
      if (!hasPhoto) {
        empty.push({
          pageNum: rightPage,
          spreadIndex: spreadIdx,
          side: 'right',
          chapter: `Bab 2 (Week ${weekNum})`,
          description: `Foto dokumentasi USG / perut Minggu ke-${weekNum} belum ada`
        });
      }
    }

    // 4. Bab 3: Persiapan (Spreads 42 to 44, pages 85 to 90)
    let bab3Data: any = null;
    try {
      const s = localStorage.getItem('bunda_bab3');
      if (s) bab3Data = JSON.parse(s);
    } catch {}

    if (!bab3Data?.nurseryPhoto) {
      empty.push({ pageNum: 86, spreadIndex: 42, side: 'right', chapter: 'Bab 3', description: 'Foto kamar / pojok menyusui bayi belum diunggah' });
    }

    // 5. Bab 4: Kelahiran (Spreads 45 to 47, pages 91 to 96)
    let bab4Data: any = null;
    try {
      const s = localStorage.getItem('bunda_bab4');
      if (s) bab4Data = JSON.parse(s);
    } catch {}

    if (!bab4Data?.firstBabyPhoto) {
      empty.push({ pageNum: 92, spreadIndex: 45, side: 'right', chapter: 'Bab 4', description: 'Foto tangisan pertama si kecil belum ditempel' });
    }
    if (!bab4Data?.footprintPhoto) {
      empty.push({ pageNum: 94, spreadIndex: 46, side: 'right', chapter: 'Bab 4', description: 'Foto cap telapak kaki/tangan bayi belum diunggah' });
    }
    if (!bab4Data?.babyWristbandPhoto || !bab4Data?.momWristbandPhoto) {
      empty.push({ pageNum: 95, spreadIndex: 47, side: 'left', chapter: 'Bab 4', description: 'Foto gelang rumah sakit Bunda & Bayi belum lengkap' });
    }
    if (!bab4Data?.familyPhoto) {
      empty.push({ pageNum: 96, spreadIndex: 47, side: 'right', chapter: 'Bab 4', description: 'Foto bertiga pertama saat pulang dari RS belum diunggah' });
    }

    // 6. Bab 5: Kapsul Waktu (Spreads 48 to 49, pages 97 to 100)
    let bab5Data: any = null;
    try {
      const s = localStorage.getItem('bunda_bab5');
      if (s) bab5Data = JSON.parse(s);
    } catch {}

    if (!bab5Data?.bundaLetterPart1 && !bab5Data?.bundaLetterPart2) {
      empty.push({ pageNum: 97, spreadIndex: 48, side: 'left', chapter: 'Bab 5', description: 'Surat wasiat cinta dari Bunda belum ditulis' });
    }
    if (!bab5Data?.ayahLetterPart1 && !bab5Data?.ayahLetterPart2) {
      empty.push({ pageNum: 99, spreadIndex: 49, side: 'left', chapter: 'Bab 5', description: 'Surat pesan kebanggaan dari Ayah belum ditulis' });
    }

    setEmptyPagesList(empty);
    setIsScanning(false);
    setScanModalOpen(true);
  };

  const currentInfo = getSpreadInfo(currentSpreadIndex);

  // Real-time chapter and topic search in drawer
  const filteredChapters = searchQuery.trim() === ''
    ? BOOK_CHAPTERS
    : BOOK_CHAPTERS.filter(ch => 
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `hal ${ch.pageStart}-${ch.pageEnd}`.includes(searchQuery.toLowerCase())
      );

  return (
    <div className="print-modal-container fixed inset-0 z-50 bg-[#151312] text-stone-800 flex flex-col overflow-hidden print:static print:bg-white print:overflow-visible print:w-[210mm] print:h-auto">
      {/* ============================================================== */}
      {/* 1. TOP HEADER: TUTUP (X), LOGO BUNDA., EDIT, & DOWNLOAD PDF     */}
      {/* ============================================================== */}
      <header className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-stone-900 border-b border-stone-800 text-white flex items-center justify-between shrink-0 print:hidden z-20">
        {/* Left: Close Button & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Tutup Studio"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="font-serif font-bold text-base sm:text-lg text-stone-100 tracking-tight">bunda.</span>

          {onGoToJournal && (
            <button
              onClick={() => {
                onClose();
                onGoToJournal();
              }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 text-[11px] font-medium transition-colors cursor-pointer border border-stone-700"
              title="Kembali ke Form Jurnal"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Ke Jurnal</span>
            </button>
          )}
        </div>

        {/* Right: Tombol Edit (Icon Only & Konsisten), Download PDF (Icon Only), dan Menu Drawer */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tombol Edit / Kunci Dokumen (Icon Only, Warna Konsisten, Pesan di Tengah 3 Detik) */}
          <button
            onClick={toggleDocumentLock}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-stone-700 active:scale-95"
            title={isDocumentLocked ? 'Mode Terkunci (Read-Only) - Klik untuk Edit' : 'Mode Edit - Klik untuk Kunci Dokumen'}
            aria-label={isDocumentLocked ? 'Buka Kunci untuk Mode Edit' : 'Kunci Dokumen'}
          >
            {isDocumentLocked ? (
              <Lock className="w-4 h-4 text-stone-300" />
            ) : (
              <Unlock className="w-4 h-4 text-stone-300" />
            )}
          </button>

          {/* Tombol Simpan PDF (Icon Only) */}
          <button
            onClick={handleOpenPrintWindow}
            className="w-8 h-8 rounded-lg bg-[#556B2F] hover:bg-[#465926] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-[#465926]"
            title="Download PDF (100 Halaman)"
            aria-label="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Menu Drawer Button (Pilihan Tema, Scan Halaman, & Daftar Bab) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-stone-700"
            title="Buka Menu & Pengaturan"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN VIEWPORT: 1 MUKA PENUH & MENGALIR KE BAWAH (PDF FLOW)  */}
      {/* ============================================================== */}
      <main 
        ref={mainContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#151312] w-full no-scrollbar relative py-4 pinch-zoom-viewport ${
          isDocumentLocked ? 'document-locked' : ''
        }`}
      >

        {/* 100 Halaman Buku Tersusun Berurutan dari Atas ke Bawah (1 Muka per Baris) */}
        <div className="w-full flex flex-col items-center justify-start overflow-x-hidden">
          {Array.from({ length: 50 }).map((_, sIdx) => {
            return (
              <div 
                key={sIdx}
                id={`spread-row-${sIdx}`}
                className="w-full flex items-center justify-center overflow-x-hidden mb-6 shrink-0"
              >
                {/* Scaled Single-Page Vertical Container: ~90% Lebar Layar HP (16px Margin) */}
                <div 
                  className="overflow-hidden shrink-0 relative mx-auto"
                  style={{
                    width: `${pageDisplayWidth}px`,
                    height: `${scaledSpreadHeight}px`,
                  }}
                >
                  <div
                    className="studio-vertical-spread shrink-0"
                    style={{
                      width: `${B5_WIDTH_PX}px`,
                      transform: `scale(${pageScale})`,
                      transformOrigin: 'top left',
                      '--page-gap-unscaled': `${pageGapUnscaled}px`,
                    } as React.CSSProperties}
                  >
                    {renderSpreadContent(sIdx)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ============================================================== */}
      {/* 3. BOTTOM CONTROL BAR: NAVIGASI & KONTROL HALAMAN              */}
      {/* ============================================================== */}
      <footer className="px-3 py-2 sm:px-4 sm:py-2.5 bg-stone-900 border-t border-stone-800 text-white flex items-center justify-between gap-2 shrink-0 print:hidden z-20">
        {/* Tombol Panah Kiri (<) */}
        <button
          disabled={currentSpreadIndex === 0}
          onClick={() => handleNavigateSpread(currentSpreadIndex - 1)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
            currentSpreadIndex === 0 
              ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-600' 
              : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 active:scale-95'
          }`}
          title="Lembar Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Area Tengah: Dropdown Bab + Indikator Lembar + Slider Hijau */}
        <div className="flex-1 max-w-md flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center justify-between w-full text-[11px] text-stone-300 px-0.5">
            {/* Dropdown Pemilih Bab */}
            <div className="relative flex items-center max-w-[65%] sm:max-w-[70%]">
              <select
                value={getCurrentChapterId()}
                onChange={(e) => handleChapterSelect(e.target.value)}
                className="bg-stone-800 text-stone-200 text-[11px] font-medium py-0.5 pl-2 pr-6 rounded-md border border-stone-700 truncate cursor-pointer appearance-none focus:outline-none focus:border-[#556B2F]"
                title="Pilih Bab"
              >
                {BOOK_CHAPTERS.map((ch) => (
                  <option key={ch.id} value={ch.id} className="bg-stone-800 text-stone-200 text-xs py-1">
                    {ch.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-1.5 pointer-events-none" />
            </div>

            {/* Indikator Halaman (Lembar 1/50) */}
            <span className="font-sans text-[11px] font-semibold text-amber-200 shrink-0 ml-2">
              Lembar {currentSpreadIndex + 1}/50
            </span>
          </div>

          {/* Slider Garis Progres Hijau */}
          <input 
            type="range"
            min="0"
            max="49"
            value={currentSpreadIndex}
            onChange={(e) => handleNavigateSpread(Number(e.target.value))}
            className="w-full accent-[#556B2F] cursor-pointer h-1.5 bg-stone-700 rounded-lg"
            title={`Lembar ${currentSpreadIndex + 1} dari 50`}
          />
        </div>

        {/* Tombol Panah Kanan (>) */}
        <button
          disabled={currentSpreadIndex === 49}
          onClick={() => handleNavigateSpread(currentSpreadIndex + 1)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
            currentSpreadIndex === 49 
              ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-600' 
              : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 active:scale-95'
          }`}
          title="Lembar Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ============================================================== */}
      {/* 3.5 CENTER TOAST NOTIFICATION: STATUS KUNCI / MODE EDIT (3 DETIK) */}
      {/* ============================================================== */}
      {lockToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <div className="bg-stone-900/95 border border-stone-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              lockToast.isLocked ? 'bg-amber-950/80 border border-amber-600/50 text-amber-400' : 'bg-[#556B2F]/30 border border-[#556B2F]/50 text-[#8FA36C]'
            }`}>
              {lockToast.isLocked ? (
                <Lock className="w-5 h-5 text-amber-400" />
              ) : (
                <Unlock className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-sm font-semibold tracking-tight text-stone-100">
                {lockToast.message}
              </span>
              <span className="text-[11px] text-stone-400 font-sans">
                {lockToast.isLocked 
                  ? 'Input dan catatan terkunci dari ketikan tidak sengaja.' 
                  : 'Ketuk pada teks atau catatan mana saja untuk mengubah isi.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HAMBURGER SLIDE-OVER DRAWER (Menu, Tema, Scan, Kunci Mode)  */}
      {/* ============================================================== */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-[#24211F] text-stone-200 w-full max-w-sm h-full flex flex-col p-4 shadow-2xl border-l border-stone-800 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-200">
            {/* Drawer Header with Search Bar replacing duplicate hamburger icon */}
            <div className="flex items-center gap-2 pb-3 border-b border-stone-800 mb-3">
              <div className="flex-1 relative flex items-center">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari halaman atau bab..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-800/90 text-stone-100 placeholder-stone-400 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-[#556B2F] transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer shrink-0"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Real-time Search Results if search query is active */}
            {searchQuery.trim() !== '' && (
              <div className="mb-4 bg-stone-850 p-2.5 rounded-xl border border-stone-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-2">
                  Hasil Pencarian:
                </span>
                {filteredChapters.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">Tidak ditemukan bab atau topik yang cocok.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    {filteredChapters.map(ch => {
                      const startSpread = Math.floor((ch.pageStart - 1) / 2);
                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setCurrentSpreadIndex(startSpread);
                            setIsMenuOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full p-2 bg-stone-800 hover:bg-[#556B2F] rounded-lg text-left text-xs transition-colors cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-medium text-white truncate mr-2">{ch.title}</span>
                          <span className="text-[10px] font-sans text-amber-200 shrink-0">Hal {ch.pageStart}-{ch.pageEnd}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Kunci Mode Jurnal (Document Lock Switch) */}
            <div className="mb-3.5">
              <button
                onClick={toggleDocumentLock}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                  isDocumentLocked 
                    ? 'bg-amber-950/40 border-amber-600/60 text-amber-100' 
                    : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDocumentLocked ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isDocumentLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold block text-xs">
                      {isDocumentLocked ? 'Kunci Dokumen: Aktif' : 'Mode Edit: Aktif'}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-light">
                      {isDocumentLocked ? 'Halaman terkunci (baca saja)' : 'Klik kolom untuk mengetik'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isDocumentLocked ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/30 text-emerald-200'
                }`}>
                  {isDocumentLocked ? 'KUNCI' : 'EDIT'}
                </span>
              </button>
            </div>

            {/* 5 Theme Switcher - Horizontal Slider Container */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#556B2F]" />
                  Pilihan Tema B5
                </span>
                <span className="text-[9px] text-stone-500 font-sans">5 Palet Warna</span>
              </div>
              <div 
                className="overflow-x-auto flex flex-nowrap gap-2 pb-1.5 no-scrollbar scroll-smooth"
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {Object.values(BOOK_THEMES).map((thm) => {
                  const isSelected = selectedThemeId === thm.id;
                  return (
                    <button
                      key={thm.id}
                      onClick={() => setSelectedThemeId(thm.id)}
                      className={`min-w-[130px] max-w-[130px] shrink-0 p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-stone-800 border-white text-white shadow-sm ring-1 ring-white/20'
                          : 'bg-stone-850/80 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0" 
                          style={{ backgroundColor: thm.swatchHex }} 
                        />
                        {isSelected && (
                          <span className="text-[9px] bg-[#556B2F] text-white font-bold px-1.5 py-0.2 rounded-xs">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-serif font-bold text-stone-100 truncate">{thm.name}</p>
                        <p className="text-[8.5px] text-stone-400 font-light truncate">{thm.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scan Halaman Belum Terisi Trigger (Positioned EXACTLY below Theme Selector) */}
            <div className="mb-4">
              <button
                onClick={handleScanEmptyPages}
                disabled={isScanning}
                className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 hover:text-amber-100 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Scan Halaman Kosong</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
                  Cek 100 Hal
                </span>
              </button>
            </div>

            {/* Download PDF */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDownloadModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#556B2F] hover:bg-[#465926] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Opsi Download PDF Presisi B5</span>
              </button>
            </div>

            {/* Lompat Bab Section */}
            <div className="mt-auto pt-3 border-t border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-[#556B2F]" />
                Daftar Bab & Halaman
              </span>
              <div className="space-y-1 max-h-52 overflow-y-auto no-scrollbar">
                {BOOK_CHAPTERS.map((ch) => {
                  const startSpread = Math.floor((ch.pageStart - 1) / 2);
                  const endSpread = Math.floor((ch.pageEnd - 1) / 2);
                  const isActive = currentSpreadIndex >= startSpread && currentSpreadIndex <= endSpread;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        const el = document.getElementById(`spread-row-${startSpread}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setCurrentSpreadIndex(startSpread);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isActive ? 'bg-[#556B2F] text-white font-bold' : 'hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate text-[11px]">{ch.title}</p>
                        <p className="text-[9px] opacity-70 truncate font-light">{ch.description}</p>
                      </div>
                      <span className="font-sans text-[10px] opacity-80 shrink-0">
                        Hal {ch.pageStart}-{ch.pageEnd}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL HASIL SCAN HALAMAN BELUM TERISI                      */}
      {/* ============================================================== */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#24211F] text-stone-200 border border-stone-700 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white">Status Kelengkapan 100 Halaman</h3>
              </div>
              <button 
                onClick={() => setScanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Stat Banner */}
            <div className="my-3 p-3 bg-stone-850 rounded-2xl border border-stone-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  {emptyPagesList.length === 0 
                    ? 'Semua Halaman Lengkap' 
                    : `Ditemukan ${emptyPagesList.length} Halaman Belum Terisi`}
                </p>
                <p className="text-[10px] text-stone-400 font-light">
                  {100 - emptyPagesList.length} dari 100 halaman sudah terisi rapi
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-sans font-bold text-[#708846]">
                  {Math.round(((100 - emptyPagesList.length) / 100) * 100)}%
                </span>
              </div>
            </div>

            {/* List of Empty Pages */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1 pr-1">
              {emptyPagesList.length === 0 ? (
                <div className="text-center py-8 text-stone-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-serif font-bold text-stone-200">Buku Kenangan Siap Dicetak!</p>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto font-light">
                    Semua foto, catatan medis dokter, dan curahan hati bunda telah tersimpan dengan sempurna.
                  </p>
                </div>
              ) : (
                emptyPagesList.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 bg-stone-800/70 hover:bg-stone-800 rounded-xl border border-stone-700/80 flex items-center justify-between gap-2.5 transition-colors"
                  >
                    <div className="flex items-start gap-2 truncate">
                      <span className="text-[10px] font-sans font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                        Hal {item.pageNum}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-stone-200 block truncate">{item.chapter}</span>
                        <span className="text-[10px] text-stone-400 block truncate font-light">{item.description}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const el = document.getElementById(`spread-row-${item.spreadIndex}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setCurrentSpreadIndex(item.spreadIndex);
                        setScanModalOpen(false);
                        setIsMenuOpen(false);
                      }}
                      className="px-2.5 py-1 bg-[#556B2F] hover:bg-[#465926] text-white text-[10px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Lompat</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-800 mt-2">
              <button
                onClick={() => setScanModalOpen(false)}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL DOWNLOAD PDF B5 PILIHAN                              */}
      {/* ============================================================== */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#24211F] text-stone-200 border border-stone-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#556B2F]" />
                <h3 className="font-serif text-sm font-bold text-white">Download PDF Presisi B5</h3>
              </div>
              <button 
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400 mb-4 font-light leading-relaxed">
              Format ukuran pas A4 (<span className="text-amber-200 font-sans">210mm x 297mm</span>) menggunakan rendering <span className="text-stone-300 font-medium">Full Linen</span> dengan margin area aman jilidan cetak hardcover.
            </p>

            <div className="space-y-2.5 mb-4">
              <button
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  handleOpenPrintWindow();
                }}
                className="w-full p-3 bg-[#556B2F] hover:bg-[#465926] text-white rounded-xl text-left transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-xs block">
                    Download Buku Jurnal (100 Halaman)
                  </span>
                  <span className="text-[10px] text-white/80 block font-light">
                    Format Presisi Asli B5 (Anti-Bocor & Anti-Geser)
                  </span>
                </div>
                <Download className="w-4 h-4 text-white shrink-0 ml-2" />
              </button>
            </div>

            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 font-medium rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. BOTTOM SHEET: LOMPAT BAB LANGSUNG DARI BAWAH               */}
      {/* ============================================================== */}
      {isBottomChapterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-150">
          <div className="bg-[#24211F] text-stone-200 w-full max-w-lg rounded-t-3xl p-4 shadow-2xl border-t border-stone-700 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#556B2F]" />
                <span className="font-serif text-sm font-bold text-white">Lompat ke Bab Buku</span>
              </div>
              <button 
                onClick={() => setIsBottomChapterOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-1.5 py-1">
              {BOOK_CHAPTERS.map((ch) => {
                const startSpread = Math.floor((ch.pageStart - 1) / 2);
                const endSpread = Math.floor((ch.pageEnd - 1) / 2);
                const isActive = currentSpreadIndex >= startSpread && currentSpreadIndex <= endSpread;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      const el = document.getElementById(`spread-row-${startSpread}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      setCurrentSpreadIndex(startSpread);
                      setIsBottomChapterOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#556B2F] border-[#556B2F] text-white shadow-xs font-semibold' 
                        : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-bold">{ch.title}</p>
                      <p className="text-[10px] opacity-75 truncate">{ch.description}</p>
                    </div>
                    <span className="font-sans text-[10px] bg-black/30 px-2 py-0.5 rounded-md shrink-0">
                      Hal {ch.pageStart}-{ch.pageEnd}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
