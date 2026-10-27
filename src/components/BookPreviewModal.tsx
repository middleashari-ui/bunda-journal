import React, { useState, useRef } from 'react';
import { PhotoMemory, UserProfile } from '../types';
import { X, Download, Check, Lock, Unlock, Loader2 } from 'lucide-react';
import { generatePDF, PDFExportProgress } from '../utils/pdfGenerator';

interface BookPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  photos: PhotoMemory[];
  journalText: string;
  week: number;
}

export const BookPreviewModal: React.FC<BookPreviewModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  photos,
  journalText,
  week,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress(0);
    try {
      await document.fonts.ready;
      const pages = scrollContainerRef.current?.querySelectorAll<HTMLElement>('.preview-pdf-page');
      if (!pages || pages.length === 0) return;

      await generatePDF(Array.from(pages), {
        fileName: 'Bunda-Journal-Preview.pdf',
        onProgress: (prog) => setPdfProgress(prog.percentage),
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
    }
  };

  if (!isOpen) return null;

  const currentPhoto = photos[0] || {
    caption: 'USG Trimester 1 (12W)',
    date: '12 Okt 2024',
    src: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  };

  return (
    <div className="book-preview-container fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print:static print:bg-white print:p-0 print:overflow-visible">
      <div className="bg-[#1C1A18] rounded-2xl sm:rounded-3xl max-w-2xl w-full h-[95vh] sm:h-[92vh] shadow-2xl border border-stone-800 flex flex-col overflow-hidden print:bg-white print:border-none print:shadow-none print:w-[176mm] print:h-auto print:overflow-visible">
        {/* ============================================================== */}
        {/* 1. TOP HEADER: TUTUP (X), LOGO BUNDA., EDIT, & DOWNLOAD PDF     */}
        {/* ============================================================== */}
        <header className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-stone-900 border-b border-stone-800 text-white flex items-center justify-between shrink-0 z-20">
          {/* Left: Close Button & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="font-serif font-bold text-base sm:text-lg text-stone-100 tracking-tight">bunda.</span>
          </div>

          {/* Right: Download PDF Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setIsEditing(e => !e)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isEditing
                  ? 'bg-emerald-950/70 border-emerald-700/70 text-emerald-300 hover:bg-emerald-900/70'
                  : 'bg-amber-950/70 border-amber-700/70 text-amber-300 hover:bg-amber-900/70'
              }`}
              title={isEditing ? 'Mode Edit Aktif' : 'Dokumen Terkunci'}
            >
              {isEditing ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{isEditing ? 'Mode Edit' : 'Terkunci'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-[#556B2F] hover:bg-[#465926] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-70"
              title="Download PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">{pdfProgress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. VERTICAL 1-PAGE FLOWING CONTAINER (PDF STANDARD)            */}
        {/* ============================================================== */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-[#141211] w-full no-scrollbar print:bg-white print:p-0 print:overflow-visible"
        >
          <div className="w-full max-w-lg mx-auto flex flex-col items-center py-2 print:w-[176mm] print:max-w-[176mm] print:p-0 print:m-0">
            
            {/* -------------------------------------------------------- */}
            {/* HALAMAN 1 (GANJIL / KIRI): COVER DEPAN                   */}
            {/* -------------------------------------------------------- */}
            <div className="preview-pdf-page w-[94%] max-w-md mx-auto mb-6 aspect-[176/250] bg-[#FAF8F5] rounded-xl shadow-2xl border border-stone-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 print:w-[176mm] print:h-[250mm] print:aspect-auto print:rounded-none print:shadow-none print:border-none print:m-0 print:p-[15mm]">
              {/* Penanda Halaman Ganjil: Pojok Kiri Atas */}
              <div className="page-badge-watermark absolute top-3 left-3 px-2.5 py-1 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-medium rounded border border-white/20 select-none pointer-events-none z-10">
                Halaman Kiri
              </div>

              <div className="flex flex-col items-center justify-center h-full text-center border-4 border-[#556B2F]/20 p-6 rounded-xl bg-[#556B2F] text-amber-100 shadow-inner my-auto">
                <span className="text-[10px] sm:text-xs tracking-widest uppercase font-sans text-amber-200/70 mb-4">
                  Koleksi Kenangan Kehamilan
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
                  Surat Pertama untuk Malaikat Kecilku
                </h1>
                <div className="w-12 h-0.5 bg-amber-300/40 my-3" />
                <p className="font-serif italic text-sm sm:text-base text-amber-100/90 mb-6">
                  {userProfile.name}
                </p>
                <span className="text-[9.5px] sm:text-[10px] text-amber-200/60 uppercase tracking-widest mt-auto font-sans">
                  Hardcover Linen Asli • Cetakan Presisi Siap Cetak
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* HALAMAN 2 (GENAP / KANAN): DEDIKASI & MILESTONE          */}
            {/* -------------------------------------------------------- */}
            <div className="preview-pdf-page w-[94%] max-w-md mx-auto mb-6 aspect-[176/250] bg-[#FAF8F5] rounded-xl shadow-2xl border border-stone-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 print:w-[176mm] print:h-[250mm] print:aspect-auto print:rounded-none print:shadow-none print:border-none print:m-0 print:p-[15mm]">
              {/* Penanda Halaman Genap: Pojok Kanan Atas */}
              <div className="page-badge-watermark absolute top-3 right-3 px-2.5 py-1 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-medium rounded border border-white/20 select-none pointer-events-none z-10">
                Halaman Kanan
              </div>

              <div className="flex flex-col justify-between h-full text-center">
                <div className="pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#556B2F] font-semibold block mb-1">
                    Trimester Pertama • Minggu ke-{week || 12}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-850">
                    Awal Mula Detak Kehidupan
                  </h2>
                </div>

                <div className="py-6 my-auto">
                  <span className="text-5xl sm:text-6xl block mb-3">🍋</span>
                  <p className="font-serif italic text-sm sm:text-base text-stone-700 max-w-xs mx-auto leading-relaxed">
                    "Wajah manismu mulai terbentuk anggun dalam keheningan rahim bunda..."
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-3 grid grid-cols-3 text-center text-stone-600 text-[10px]">
                  <div>
                    <span className="block text-stone-400">Panjang</span>
                    <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">5.4 cm</span>
                  </div>
                  <div>
                    <span className="block text-stone-400">Detak Jantung</span>
                    <span className="font-serif font-bold text-stone-800 text-xs sm:text-sm">155 bpm</span>
                  </div>
                  <div>
                    <span className="block text-stone-400">HPL</span>
                    <span className="font-serif font-bold text-[#C87A64] text-xs sm:text-sm">{userProfile.hplDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* HALAMAN 3 (GANJIL / KIRI): DOKUMENTASI ULTRASONOGRAFI    */}
            {/* -------------------------------------------------------- */}
            <div className="preview-pdf-page w-[94%] max-w-md mx-auto mb-6 aspect-[176/250] bg-[#FAF8F5] rounded-xl shadow-2xl border border-stone-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 print:w-[176mm] print:h-[250mm] print:aspect-auto print:rounded-none print:shadow-none print:border-none print:m-0 print:p-[15mm]">
              {/* Penanda Halaman Ganjil: Pojok Kiri Atas */}
              <div className="page-badge-watermark absolute top-3 left-3 px-2.5 py-1 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-medium rounded border border-white/20 select-none pointer-events-none z-10">
                Halaman Kiri
              </div>

              <div className="flex flex-col justify-between h-full">
                <div className="text-center pb-2 border-b border-stone-200">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                    Dokumentasi Ultrasonografi
                  </span>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-stone-800">
                    {currentPhoto.caption}
                  </h3>
                </div>

                <div className="my-auto rounded-xl overflow-hidden border-2 border-stone-300 shadow-md aspect-[4/3] bg-black flex items-center justify-center">
                  <img 
                    src={currentPhoto.src} 
                    alt={currentPhoto.caption} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center pt-2">
                  <p className="font-serif italic text-xs text-stone-500">
                    Diabadikan pada {currentPhoto.date} bersama {userProfile.doctorName}
                  </p>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* HALAMAN 4 (GENAP / KANAN): JURNAL & SURAT CINTA BUNDA    */}
            {/* -------------------------------------------------------- */}
            <div className="preview-pdf-page w-[94%] max-w-md mx-auto mb-6 aspect-[176/250] bg-[#FAF8F5] rounded-xl shadow-2xl border border-stone-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 print:w-[176mm] print:h-[250mm] print:aspect-auto print:rounded-none print:shadow-none print:border-none print:m-0 print:p-[15mm]">
              {/* Penanda Halaman Genap: Pojok Kanan Atas */}
              <div className="page-badge-watermark absolute top-3 right-3 px-2.5 py-1 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-medium rounded border border-white/20 select-none pointer-events-none z-10">
                Halaman Kanan
              </div>

              <div className="flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#C87A64] font-semibold block">
                    Curahan Hati Bunda
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-800 mt-0.5">
                    Surat Cinta Hari ke-84
                  </h3>
                </div>

                <div className="my-auto py-2">
                  <p className="font-serif italic text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap first-letter:text-3xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-[#556B2F]">
                    {journalText || 'Hari ini detak jantungmu terdengar begitu jelas saat kontrol dokter. Bahagia dan haru sekali, nak... Semoga tumbuh sehat selalu dalam dekapan bunda.'}
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-3 flex justify-between items-center text-[10px] text-stone-400">
                  <span>Dicetak di Atas Kertas Fine Art Bebas Asam</span>
                  <span className="font-serif italic text-stone-600">{userProfile.name}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

