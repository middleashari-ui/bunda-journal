import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

export interface OnboardingJurnalTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

interface StepConfig {
  id: string;
  title: string;
  targetId: string;
  badge: string;
  description: string;
  subDescription?: string;
  hint?: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'week-nav',
    targetId: 'tour-step-week-nav',
    title: 'Navigasi Usia Kehamilan',
    badge: 'Minggu 5 - 40',
    description:
      'Geser panah kiri dan kanan untuk melihat perkembangan janin dari ukuran buah Wijen hingga Semangka.',
    subDescription:
      'Ikon buah dan usia kehamilan di pojok kanan atas berganti otomatis sesuai minggu yang dipilih.',
    hint: 'Contoh: Minggu 32 • Buah Kubis • Hari 224',
  },
  {
    id: 'day-strip',
    targetId: 'tour-step-day-strip',
    title: 'Pilih Hari Pencatatan',
    badge: '7 Hari Seminggu',
    description:
      'Ketuk salah satu hari untuk mencatat. Kotak hitam menandai hari ini (misal SAB 31).',
    subDescription:
      'Titik hijau menandakan catatan hari sudah terisi, sedangkan putih belum. Tanggal otomatis diperbarui saat minggu berganti.',
    hint: 'RAB 28 • KAM 29 • JUM 30 • SAB 31 • MIN 1 • SEN 2 • SEL 3',
  },
  {
    id: 'catatan-bunda',
    targetId: 'tour-step-catatan-bunda',
    title: 'Catatan Perasaan Bunda',
    badge: '0 / 100 Huruf',
    description:
      'Tuliskan perasaan, cerita, atau momen berharga Bunda hari ini (maksimal 100 huruf).',
    subDescription:
      'Mindful counter menghitung otomatis, dan catatan langsung tersimpan aman dengan dot hijau.',
    hint: 'Fokus pada perasaan Bunda dan si kecil hari ini',
  },
  {
    id: 'kebutuhan-jasmani',
    targetId: 'tour-step-jasmani',
    title: 'Target Kebutuhan Jasmani',
    badge: '3 Cincin Aktivitas',
    description:
      'Pantau kesehatan fisik harian dengan target 3 cincin: Jalan Santai (15-30 mnt), Senam/Yoga, dan Tidur Cukup.',
    subDescription:
      'Lihat ketiga cincin progres naik dan persentase bertambah seiring Bunda memenuhi target.',
    hint: 'Progres 67% • Jalan Santai 15 mnt',
  },
  {
    id: 'statistik-fisik',
    targetId: 'tour-step-statistik',
    title: 'Statistik Fisik Bunda',
    badge: 'Data Mingguan',
    description:
      'Pantau perkembangan tubuh Bunda secara berkala dengan mengisi Berat Badan, Lingkar Perut, dan Tekanan Darah.',
    subDescription:
      'Cukup ketuk kotak angka untuk mengisi atau memperbarui data kesehatan fisik Bunda.',
    hint: 'Berat: 54.5 kg • Lingkar: 82 cm • Tensi: 118/76',
  },
  {
    id: 'catatan-dokter',
    targetId: 'tour-step-dokter',
    title: 'Catatan Dokter Obgyn / Bidan',
    badge: '0 / 500 Karakter',
    description:
      'Rangkum hasil pemeriksaan medis, detak jantung janin, dan saran vitamin dari dokter kandungan atau bidan.',
    subDescription:
      'Bunda juga bisa langsung melampirkan foto hasil USG pertama di dalam kartu ini.',
    hint: 'Maksimal 500 karakter • Disertai foto USG',
  },
  {
    id: 'foto-usg',
    targetId: 'tour-step-foto-usg',
    title: 'Galeri Foto USG & Perut',
    badge: 'Grid Polaroid 4/5',
    description:
      'Dokumentasikan potret USG dan perut kehamilan dalam bingkai polaroid kenangan.',
    subDescription:
      'Ketuk frame kosong untuk mengunggah foto. Foto pertama dari Catatan Dokter otomatis muncul di galeri ini.',
    hint: 'Format 2x2 grid estetik untuk buku cetak',
  },
  {
    id: 'jadwal-riwayat',
    targetId: 'tour-step-jadwal',
    title: 'Jadwal Pertemuan & Riwayat Medis',
    badge: 'Kartu Nama 360x210 & WA',
    description:
      'Atur status jadwal kunjungan dokter: Menunggu (oranye) atau Booked (hijau). Hubungi langsung via WhatsApp suami dari Kartu Nama Dokter.',
    subDescription:
      'Buka riwayat catatan dokter 44px yang ringkas. Sistem otomatis kembali ke hari ini setelah 5 menit jeda.',
    hint: 'Direct WhatsApp suami • Auto-kembali 5 menit idle',
  },
];

export const OnboardingJurnalTutorial: React.FC<OnboardingJurnalTutorialProps> = ({
  isOpen,
  onClose,
  onFinish,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = STEPS[currentStepIndex];

  // Update spotlight bounding rect when step changes or window scrolls/resizes
  const updateHighlight = useCallback(() => {
    if (!isOpen) return;
    const target = document.getElementById(step.targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      setHighlightRect({
        top: Math.max(6, rect.top - 6),
        left: Math.max(6, rect.left - 6),
        width: Math.min(window.innerWidth - 12, rect.width + 12),
        height: rect.height + 12,
      });
    } else {
      // Fallback center box
      setHighlightRect({
        top: window.innerHeight * 0.25,
        left: Math.max(16, (window.innerWidth - 360) / 2),
        width: Math.min(window.innerWidth - 32, 360),
        height: 180,
      });
    }
  }, [isOpen, step.targetId]);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll to target element
    const target = document.getElementById(step.targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timer = setTimeout(updateHighlight, 250);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [isOpen, currentStepIndex, step.targetId, updateHighlight]);

  if (!isOpen) return null;

  const handleComplete = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('bunda_onboarding_done', 'true');
      } catch {}
    }

    onClose();

    if (onFinish) {
      onFinish();
    } else {
      // Focus textarea
      setTimeout(() => {
        const textarea = document.getElementById('textarea-catatan-harian');
        if (textarea) {
          textarea.focus();
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Determine card placement: if target is in bottom half, put card at top; else at bottom
  const isTargetInBottomHalf = highlightRect ? highlightRect.top > window.innerHeight * 0.45 : false;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden">
      {/* Spotlight Hole with box-shadow: 0 0 0 9999px rgba(0,0,0,0.34) */}
      {highlightRect && (
        <div
          className="fixed transition-all duration-300 ease-out pointer-events-none rounded-[20px] border-2 border-white/80"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.34)',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* Floating Tutorial Card (Max 390px, White 95%, SAGE Theme) */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[390px] z-50 transition-all duration-300 ${
          isTargetInBottomHalf ? 'top-4' : 'bottom-20'
        }`}
      >
        <div className="bg-white/95 rounded-[20px] p-4 sm:p-5 border border-[#EDE8DF] shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md space-y-3 font-sans text-[#292524]">
          {/* Top Row: 8 Progress Dots + Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`transition-all rounded-full cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 h-1.5 bg-stone-900'
                      : idx < currentStepIndex
                      ? 'w-1.5 h-1.5 bg-[#556B2F]'
                      : 'w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Langkah ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-medium text-stone-500 font-sans">
                {currentStepIndex + 1}/8
              </span>
              <button
                type="button"
                onClick={handleComplete}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#556B2F]/10 border border-[#556B2F]/20 text-[#556B2F] text-[9.5px] font-bold uppercase tracking-wider">
                {step.badge}
              </span>
            </div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 leading-tight">
              {step.title}
            </h3>
          </div>

          {/* Descriptions (Clean, No JSON) */}
          <div className="text-xs text-stone-650 space-y-1 leading-relaxed">
            <p className="font-medium text-stone-850">{step.description}</p>
            {step.subDescription && (
              <p className="text-[11px] text-stone-500">{step.subDescription}</p>
            )}
            {step.hint && (
              <div className="mt-1.5 p-2 rounded-lg bg-[#FAF8F5] border border-[#EDE8DF] text-[10.5px] text-[#556B2F] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{step.hint}</span>
              </div>
            )}
          </div>

          {/* Footer Controls: Checkbox + Buttons */}
          <div className="pt-2 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Checkbox: Jangan tampilkan lagi (Internal only) */}
              <label className="flex items-center gap-1.5 text-[10.5px] text-stone-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer accent-stone-900"
                />
                <span>Jangan tampilkan lagi</span>
              </label>

              {/* Lewati link */}
              <button
                type="button"
                onClick={handleComplete}
                className="text-stone-400 hover:text-stone-700 text-[11px] font-medium cursor-pointer transition-colors"
              >
                Lewati
              </button>
            </div>

            {/* Nav Buttons Row */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="h-11 min-h-[44px] px-3.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 h-11 min-h-[44px] rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
              >
                {currentStepIndex === STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Mulai Mengisi Jurnal</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Langkah {currentStepIndex + 2}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
