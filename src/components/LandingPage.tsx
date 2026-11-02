import React, { useState, useRef } from 'react';
import { 
  ArrowRight, 
  Mic, 
  Play, 
  Check, 
  Droplets, 
  Heart, 
  ScanLine, 
  Users, 
  X, 
  Activity, 
  Apple
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onStartCheckout?: (amount?: number) => void;
  isPaid?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onStartCheckout, isPaid = false }) => {
  const [isPaidPreview, setIsPaidPreview] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pricingRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div 
      className="min-h-screen bg-[#FAFAF9] text-[#111] antialiased selection:bg-[#111] selection:text-white overflow-x-clip"
      style={{
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        lineHeight: "1.5",
        paddingTop: "var(--safe-area-inset-top)",
        boxSizing: "border-box"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>

      {/* Header Sticky */}
      <header className="sticky top-[var(--safe-area-inset-top)] z-30 bg-[#FAFAF9]/80 backdrop-blur-[12px] border-b border-[#E5E5E5]">
        <div className="max-w-[1120px] mx-auto px-6 md:px-8 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="cursor-pointer" onClick={onEnterApp}>
              <img src="/bunda_journal_FINAL_BIG.png" className="h-10 md:h-12 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#666]">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#111] transition-colors">
                Beranda
              </a>
              <a href="#jurnal" onClick={(e) => { e.preventDefault(); journalRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#111] transition-colors">
                Jurnal
              </a>
              <a href="#studio" onClick={(e) => { e.preventDefault(); scrollToPricing(); }} className="hover:text-[#111] transition-colors">
                Studio
              </a>
              <a href="#profil" onClick={(e) => { e.preventDefault(); showToast("Profil — silakan masuk ke aplikasi Bunda"); }} className="hover:text-[#111] transition-colors">
                Profil
              </a>
            </nav>
          </div>
          <button 
            onClick={isPaid ? onEnterApp : () => {
              if (onStartCheckout) {
                onStartCheckout(129000);
              } else {
                onEnterApp();
              }
            }}
            className="h-[32px] px-4 rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] font-medium hover:bg-[#111] hover:text-white hover:border-[#111] transition-all cursor-pointer shadow-2xs"
          >
            {isPaid ? 'Buka Aplikasi' : 'Miliki VIP 129rb'}
          </button>
        </div>
      </header>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 h-[36px] rounded-[8px] bg-[#111] text-white text-[12px] font-medium flex items-center shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* SECTION 1: HERO */}
      <section className="max-w-[1120px] mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-8 items-start">
          <div className="max-w-[520px]">
            <div className="inline-flex items-center gap-2 h-[24px] px-2.5 rounded-[8px] border border-[#E5E5E5] bg-white text-[11px] tracking-wide text-[#666] mb-6 shadow-2xs">
              <span className="w-[4px] h-[4px] rounded-full bg-[#111] animate-pulse" />
              BARU — MODE AYAH READ-ONLY
            </div>

            <h1 className="serif text-[32px] md:text-[44px] leading-[0.95] tracking-[-0.03em] font-normal mb-5 text-[#111]">
              USG berantakan jadi <br />
              <span className="italic">buku warisan 5 menit</span>
            </h1>

            <p className="text-[14px] leading-[1.6] text-[#666] mb-8 max-w-[420px]">
              100 halaman + 10 Voice QR suara detak jantung. Sekali bayar Rp129rb, bukan langganan Rp800rb/tahun kayak Flo.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <button 
                onClick={onStartCheckout ? () => onStartCheckout(129000) : onEnterApp}
                className="h-[40px] px-5 rounded-[8px] bg-[#111] text-white text-[13px] font-medium flex items-center gap-2 hover:bg-black transition-colors cursor-pointer shadow-sm"
              >
                Miliki VIP — Rp 129rb <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsPreviewModalOpen(true)}
                className="h-[40px] px-5 rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] font-medium hover:border-[#111] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5" /> Lihat Contoh
              </button>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-[#E5E5E5]">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((v) => (
                  <div key={v} className="w-7 h-7 rounded-full border-2 border-[#FAFAF9] bg-[#E5E5E5] flex items-center justify-center text-[10px] font-medium text-stone-700">
                    I
                  </div>
                ))}
              </div>
              <div className="text-[11px] leading-[1.3] text-[#666]">
                <span className="text-[#111] font-medium">62 ibu</span> middle-low sudah buat<br />
                buku warisan minggu ini
              </div>
              <div className="ml-auto flex items-center gap-1 text-[11px]">
                <span className="text-[#111]">★★★★★</span>
                <span className="text-[#666]">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockups */}
          <div className="relative md:ml-auto w-full max-w-[420px] aspect-[1/1.1] md:aspect-[4/3.2] select-none">
            <div className="absolute inset-0 rounded-[8px] border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />
            </div>

            {/* Back Polaroid Card */}
            <div className="absolute top-[18%] left-[12%] w-[68%] rotate-[-8deg] bg-white border border-[#E5E5E5] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-3 pb-10 transition-transform hover:rotate-[-6deg]">
              <div className="aspect-[4/3] bg-[#F5F5F3] rounded-[4px] border border-[#E5E5E5] overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[70%] h-[60%] bg-[#111]/5 rounded-full blur-[12px]" />
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] tracking-widest text-[#999]">
                  USG 4D • W37 • 5.4CM
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-[4px] bg-[#111] text-white flex items-center justify-center text-[10px]">
                  ◐
                </div>
              </div>
              <div className="mt-3 serif text-[14px] leading-none text-[#111]">
                W37 • Lemon 🍋
              </div>
              <div className="mt-1 text-[10px] text-[#999]">
                Est. 2.9kg • WHO P50
              </div>
            </div>

            {/* Front Acoustic Voice QR Card */}
            <div className="absolute top-[28%] left-[22%] w-[68%] rotate-[4deg] bg-white border border-[#111] rounded-[8px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-3 pb-6 transition-transform hover:rotate-[2deg]">
              <div className="aspect-[4/3] bg-[#111] rounded-[4px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#111]" />
                <div className="absolute inset-0 opacity-40">
                  <div 
                    className="w-full h-full"
                    style={{
                      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)"
                    }}
                  />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48%] h-[48%] border border-white/20 rounded-[50%] flex items-center justify-center">
                  <div className="w-[70%] h-[70%] border border-white/10 rounded-[50%]" />
                </div>
                <div className="absolute top-3 left-3 text-[8px] text-white/60 tracking-widest">
                  BUNDA JOURNAL • 5.4CM
                </div>
                <div className="absolute bottom-3 right-3 flex gap-1 items-end">
                  <div className="w-[2px] h-[12px] bg-white/80" />
                  <div className="w-[2px] h-[8px] bg-white/60" />
                  <div className="w-[2px] h-[16px] bg-white/90" />
                  <div className="w-[2px] h-[10px] bg-white/70" />
                </div>
              </div>

              <div className="mt-3 flex justify-between items-end">
                <div>
                  <div className="serif text-[15px] leading-none text-[#111]">
                    Detak 142 bpm
                  </div>
                  <div className="mt-1 text-[10px] text-[#666]">
                    15s • 30KB webm
                  </div>
                </div>
                <div className="w-[56px] h-[56px] rounded-[4px] border border-[#E5E5E5] bg-white p-1">
                  <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px]">
                    {Array.from({ length: 25 }).map((_, g) => (
                      <div 
                        key={g} 
                        className={`${[0,1,2,4,6,8,10,12,14,16,18,20,21,22,24].includes(g) ? "bg-[#111]" : "bg-white"} rounded-[0.5px]`}
                      />
                    ))}
                  </div>
                  <div className="text-[5px] text-center leading-none mt-0.5 tracking-widest text-[#666]">
                    QR VOICE
                  </div>
                </div>
              </div>

              <div className="mt-3 h-[28px] rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-center px-2 gap-2">
                <div className="w-4 h-4 rounded-full bg-[#111] flex items-center justify-center">
                  <Play className="w-2 h-2 text-white fill-white ml-[1px]" />
                </div>
                <div className="flex-1 h-[2px] bg-[#E5E5E5] rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-[#111]" />
                </div>
                <span className="text-[9px] text-[#999]">0:07 / 0:15</span>
              </div>
            </div>

            {/* Micro Badge Link */}
            <div className="absolute bottom-[8%] right-[4%] bg-[#111] text-white rounded-[8px] px-3 py-2 text-[11px] leading-[1.2] shadow-lg rotate-[-2deg]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span>bundajournal.my.id/v/xxx</span>
              </div>
              <div className="text-white/60 text-[9px] mt-0.5">
                scan • 10 voice QR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FLO VS BUNDA COMPARISON */}
      <section className="border-y border-[#E5E5E5] bg-white">
        <div className="max-w-[1120px] mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-[11px] tracking-[0.12em] text-[#999] mb-2 font-medium">
                KENAPA PINDAH?
              </div>
              <h2 className="serif text-[22px] md:text-[28px] leading-[1.1] tracking-[-0.02em] text-[#111]">
                Flo mahal & paywall. Bunda warisan.
              </h2>
            </div>
            <div className="hidden md:block text-[11px] text-[#999]">
              Perbandingan jujur • data publik
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_1fr] gap-px bg-[#E5E5E5] rounded-[8px] overflow-hidden border border-[#E5E5E5]">
            {/* Flo Column */}
            <div className="bg-[#FAFAF9] p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E5E5] flex items-center justify-center text-[12px] font-medium text-stone-700">
                    F
                  </div>
                  <div className="text-[14px] font-medium text-stone-800">Flo</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#E5E5E5] text-[#666]">
                    $59.99 / tahun
                  </span>
                </div>
                <span className="text-[11px] text-[#999]">4.7★ • paywall</span>
              </div>

              <div className="space-y-3 text-[13px] text-[#666]">
                <div className="flex justify-between py-2 border-b border-[#E5E5E5]/60">
                  <span>Rp800rb / tahun</span>
                  <span className="text-[#999]">Langganan</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5E5]/60">
                  <span>Prediksi period only</span>
                  <span className="text-[#999]">Tidak ada buku</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5E5]/60">
                  <span>Data di cloud AS</span>
                  <span className="text-[#999]">Butuh internet</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Paywall artikel</span>
                  <span className="text-[#999]">Upsell terus</span>
                </div>
              </div>
            </div>

            {/* Bunda Column */}
            <div className="bg-[#111] text-white p-6 md:p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-white/[0.04] rounded-full blur-[24px]" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-white text-[#111] flex items-center justify-center serif text-[14px] font-bold">
                    b.
                  </div>
                  <div className="text-[14px] font-medium text-white">Bunda Journal</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-white text-[#111] font-medium">
                    Rp129rb sekali
                  </span>
                </div>
                <span className="text-[11px] text-white/60">Offline • warisan</span>
              </div>

              <div className="space-y-3 text-[13px] text-white/70">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white">Rp129rb one-time</span>
                  <span className="text-white flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3 text-emerald-400" /> Hemat 84%
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white">100 hal buku + 10 Voice QR</span>
                  <span className="text-white/60">WHO P10-P50-P90</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white">Offline first, export PDF</span>
                  <span className="text-white/60">Milik selamanya</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white">Mode Ayah + Surat auto</span>
                  <span className="text-white/60">Tanpa paywall</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#999]">
            <div className="w-px h-3 bg-[#E5E5E5]" />
            <span>
              62 ibu pilih Bunda karena <span className="text-[#111] font-medium">sekali bayar jadi warisan</span>, bukan sewa data bulanan.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES GRID */}
      <section ref={journalRef} className="max-w-[1120px] mx-auto px-6 md:px-8 py-14 md:py-20">
        <div className="max-w-[560px] mb-10">
          <h2 className="serif text-[26px] md:text-[32px] leading-[1.05] tracking-[-0.02em] mb-3 text-[#111]">
            Semua yang Flo tidak kasih, kita tulis.
          </h2>
          <p className="text-[13px] leading-[1.6] text-[#666]">
            Didesain buat ibu middle-low: offline, ringan, jelas. Bukan dashboard medis penuh istilah.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-[#E5E5E5] border border-[#E5E5E5] rounded-[8px] overflow-hidden">
          {/* Card 1: WHO Curve */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              WHO CURVE • P10-P50-P90
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Median 5.4cm <br />
              rentang 4.5-6.5cm
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Grafik pertumbuhan standar WHO, bukan tebak-tebakan. Bunda lihat posisi janin di persentil.
            </p>
            <div className="mt-auto h-[36px] rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-end px-2 pb-1 gap-[2px]">
              {[3, 5, 4, 7, 6, 8, 7, 9, 8].map((v, g) => (
                <div 
                  key={g} 
                  className={`flex-1 rounded-[2px] ${g === 5 ? "bg-[#111]" : "bg-[#E5E5E5]"}`}
                  style={{ height: `${v * 4}px` }} 
                />
              ))}
            </div>
          </div>

          {/* Card 2: Lemon Milestone */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Apple className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              MILESTONE • W37
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Lemon 5.4cm <br />
              W37 milestone
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Ukuran buah tiap minggu biar ayah & keluarga kebayang. Minggu ini sebesar lemon.
            </p>
            <div className="mt-auto flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-center justify-center text-[18px]">
                🍋
              </div>
              <div className="text-[11px] leading-[1.2]">
                <div className="font-medium text-[#111]">W37 • 2.9kg est.</div>
                <div className="text-[#999]">Siap lahir kapan aja</div>
              </div>
              <div className="ml-auto text-[10px] px-2 py-1 rounded-[6px] bg-[#111] text-white">
                P50
              </div>
            </div>
          </div>

          {/* Card 3: 3 Rings Jasmani */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              3 RINGS • JASMANI
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Jalan / Senam / Tidur <br />
              78%
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Apple Watch-style rings tapi buat ibu hamil. Gerak, senam, tidur cukup hari ini.
            </p>
            <div className="mt-auto flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full border-[3px] border-[#111] border-t-transparent rotate-[45deg]" />
                <div className="w-8 h-8 rounded-full border-[3px] border-[#E5E5E5] border-t-[#999] rotate-[120deg]" />
                <div className="w-8 h-8 rounded-full border-[3px] border-[#E5E5E5] border-t-[#111] rotate-[200deg]" />
              </div>
              <div className="text-[11px] text-[#666]">
                3/3 target • 78% hari ini
              </div>
            </div>
          </div>

          {/* Card 4: Voice QR */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              VOICE QR • 15S WEBM 30KB
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Suara detak jantung <br />
              jadi QR warisan
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Rekam 15 detik, simpan 30KB. Tempel QR di buku, scan kapan pun — bundajournal.my.id/v/xxx
            </p>
            <div className="mt-auto flex items-center gap-2 h-[32px] px-2.5 rounded-[6px] bg-[#111] text-white">
              <ScanLine className="w-4 h-4" />
              <span className="text-[11px] tracking-wide">bundajournal.my.id/v/xxx</span>
              <span className="ml-auto text-[10px] opacity-60">2×2cm</span>
            </div>
          </div>

          {/* Card 5: Mode Ayah Read-Only */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              MODE AYAH • READ-ONLY
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Ayah bisa lihat, <br />
              tidak bisa ubah
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Share link read-only ke suami. Dia ikut deg-degan tanpa takut kepencet hapus data.
            </p>
            <div className="mt-auto flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-[#111] border-2 border-white flex items-center justify-center text-[9px] text-white">
                  I
                </div>
                <div className="w-6 h-6 rounded-full bg-[#E5E5E5] border-2 border-white flex items-center justify-center text-[9px] text-stone-700">
                  A
                </div>
              </div>
              <span className="text-[11px] text-[#666]">Ibu (edit) • Ayah (lihat)</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Card 6: Suplemen & Air */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#999] mb-2 font-medium">
              SUPLEMEN & AIR • 1.5/2.0L
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Air & vitamin <br />
              tanpa ribet
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Ceklis 1.5L / 2.0L + suplemen. Bukan tracking kalori bikin stres.
            </p>
            <div className="mt-auto">
              <div className="flex justify-between text-[10px] text-[#999] mb-1">
                <span>Air hari ini</span>
                <span>1.5 / 2.0L</span>
              </div>
              <div className="h-[6px] rounded-full bg-[#E5E5E5] overflow-hidden">
                <div className="h-full w-[75%] bg-[#111] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PRICING & PAYMENT */}
      <section ref={pricingRef} id="studio" className="bg-white border-y border-[#E5E5E5]">
        <div className="max-w-[1120px] mx-auto px-6 md:px-8 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="serif text-[26px] md:text-[32px] leading-[1.05] tracking-[-0.02em] text-[#111]">
                Sekali bayar, jadi warisan.
              </h2>
              <p className="mt-2 text-[13px] text-[#666] max-w-[480px]">
                Bukan langganan. File PDF + QR milikmu selamanya. Bisa cetak di percetakan dekat rumah.
              </p>
            </div>

            {/* Live Toggle Simulation (Sebelum Bayar vs Setelah Bayar) */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className={!isPaidPreview ? "text-[#111] font-medium" : "text-[#999]"}>
                Sebelum bayar
              </span>
              <button 
                onClick={() => setIsPaidPreview(!isPaidPreview)}
                className={`relative w-[36px] h-[20px] rounded-full transition-colors cursor-pointer ${isPaidPreview ? "bg-[#111]" : "bg-[#E5E5E5]"}`}
              >
                <span 
                  className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all ${isPaidPreview ? "left-[18px]" : "left-[2px]"}`}
                />
              </button>
              <span className={isPaidPreview ? "text-[#111] font-medium" : "text-[#999]"}>
                Setelah bayar
              </span>
            </div>
          </div>

          {!isPaidPreview ? (
            /* 2 Pricing Cards: 129rb VIP Digital Lengkap vs 249rb Hardcover Fisik */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[820px] mx-auto bg-[#E5E5E5] p-px rounded-[12px] overflow-hidden">
              {/* Plan 1: VIP Memorable */}
              <div className="bg-[#111] text-white p-6 md:p-8 flex flex-col relative overflow-hidden rounded-[11px]">
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] tracking-[0.08em] px-2.5 py-1 rounded-[6px] bg-white text-[#111] font-semibold">
                    BEST VALUE
                  </span>
                </div>
                <div className="text-[11px] tracking-[0.08em] text-white/60 mb-3 font-medium">
                  VIP DIGITAL LENGKAP
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="serif text-[32px] md:text-[36px] leading-none text-white">Rp129rb</span>
                  <span className="text-[12px] text-white/60 line-through">Rp249rb</span>
                </div>
                <div className="text-[12px] text-white/60 mb-6">Paling dipilih 62 ibu minggu ini</div>
                <ul className="space-y-3 text-[13px] mb-8 text-white/90">
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span><b className="font-semibold text-white">100 halaman</b> buku kenangan digital</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span><b className="font-semibold text-white">10 Voice QR</b> rekaman detak jantung</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Mode Ayah pendamping read-only</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Grafik pertumbuhan WHO P10-P50-P90</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Export PDF & 3 template siap cetak</span>
                  </li>
                </ul>
                <button 
                  onClick={onStartCheckout ? () => onStartCheckout(129000) : onEnterApp}
                  className="mt-auto h-[44px] rounded-[8px] bg-white text-[#111] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#FAFAF9] transition-colors cursor-pointer shadow-sm"
                >
                  Miliki VIP — Rp 129rb <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="mt-3 text-[10px] text-white/50 text-center">
                  Bayar sekali seumur hidup, bukan langganan
                </div>
              </div>

              {/* Plan 2: Hardcover Cetak Fisik */}
              <div className="bg-white p-6 md:p-8 flex flex-col rounded-[11px]">
                <div className="text-[11px] tracking-[0.08em] text-[#999] mb-3 flex items-center gap-2 font-medium">
                  <span>HARDCOVER CETAK FISIK</span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#556B2F]/10 text-[#556B2F] font-bold text-[9px]">
                    FISIK
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="serif text-[32px] md:text-[36px] leading-none text-[#111]">Rp249rb</span>
                  <span className="text-[12px] text-[#999]">cetak + kirim</span>
                </div>
                <div className="text-[12px] text-[#666] mb-6">Buku cetak fisik eksklusif 100 halaman B5</div>
                <ul className="space-y-3 text-[13px] text-[#444] mb-8">
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span><b>Semua fitur VIP Digital Lengkap</b></span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span>100 halaman buku cetak B5 art paper</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span>Hardcover jilid linen eksklusif dengan nama</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span>Gratis ongkir se-Indonesia</span>
                  </li>
                </ul>
                <button 
                  onClick={onStartCheckout ? () => onStartCheckout(249000) : onEnterApp}
                  className="mt-auto h-[44px] rounded-[8px] border border-[#556B2F] text-[#556B2F] bg-white text-[13px] font-semibold hover:bg-[#556B2F] hover:text-white transition-colors cursor-pointer"
                >
                  Pesan Cetak Fisik — Rp 249rb
                </button>
                <div className="mt-3 text-[10px] text-stone-400 text-center">
                  Siap kirim setelah kehamilan selesai
                </div>
              </div>
            </div>
          ) : (
            /* Condition: Setelah Bayar (Active VIP Status) */
            <div className="rounded-[8px] border border-[#16a34a]/20 bg-[#f0fdf4] overflow-hidden">
              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-px bg-[#16a34a]/10">
                <div className="bg-[#f0fdf4] p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#16a34a] text-white text-[11px] font-medium mb-5 shadow-2xs">
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#16a34a]" />
                    </div>
                    Pembayaran Berhasil — VIP Aktif
                  </div>

                  <h3 className="serif text-[24px] leading-[1.1] tracking-[-0.02em] text-[#14532d] mb-3">
                    Buku warisanmu sudah aktif, Bunda.
                  </h3>
                  <p className="text-[13px] leading-[1.6] text-[#166534] max-w-[420px] mb-8">
                    Rp129rb sekali bayar. Tidak ada tagihan tahunan kayak Flo. 100 halaman + 10 Voice QR siap diisi.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={onEnterApp}
                      className="h-[40px] px-5 rounded-[8px] bg-[#111] text-white text-[13px] font-medium flex items-center gap-2 hover:bg-black transition-colors cursor-pointer"
                    >
                      Buka Jurnal Sekarang <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setIsPaidPreview(false)}
                      className="h-[40px] px-5 rounded-[8px] border border-[#16a34a]/20 bg-white text-[13px] font-medium text-[#14532d] hover:border-[#16a34a]/40 transition-colors cursor-pointer"
                    >
                      Lihat harga lagi
                    </button>
                  </div>

                  <div className="mt-8 flex gap-6 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="w-3.5 h-3.5" /> 100 halaman aktif
                    </div>
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="w-3.5 h-3.5" /> 10 Voice QR
                    </div>
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="w-3.5 h-3.5" /> Mode Ayah
                    </div>
                  </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-white p-6 flex flex-col justify-center gap-4 border-l border-emerald-100">
                  <div className="rounded-[8px] border border-[#E5E5E5] p-4 bg-[#FAFAF9]">
                    <div className="text-[11px] text-[#999] mb-1 font-medium">INVOICE PEMBAYARAN</div>
                    <div className="serif text-[18px] text-[#111] mb-2 font-normal">VIP Memorable • Lunas</div>
                    <div className="text-[11px] text-[#666] flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span>Nominal</span>
                      <span className="font-semibold text-[#111]">Rp 129.000</span>
                    </div>
                    <div className="text-[11px] text-[#666] flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span>Metode</span>
                      <span className="font-medium text-[#111]">QRIS Standar</span>
                    </div>
                    <div className="text-[11px] text-[#666] flex justify-between py-1">
                      <span>Status</span>
                      <span className="text-emerald-600 font-semibold">PAID • is_paid: true</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-[1120px] mx-auto px-6 md:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="serif text-[20px] font-normal text-[#111]">bunda.</div>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#999] max-w-[280px]">
              Jurnal warisan minimal untuk 62 ibu middle-low Indonesia. Dibuat offline-first, bukan SaaS mahal.
            </div>
          </div>

          <div className="flex gap-12 text-[12px]">
            <div>
              <div className="font-medium mb-3 text-[#111]">Produk</div>
              <div className="space-y-2 text-[#666]">
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Jurnal</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Studio Cetak</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Voice QR</div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-3 text-[#111]">Bantuan</div>
              <div className="space-y-2 text-[#666]">
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Format standar A5 Linen 100 halaman")}>Cara cetak</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Hubungi PIC CS: m.yamin.ashri")}>WhatsApp CS</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Data aman tersimpan di HP Bunda")}>FAQ Warisan</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#999]">
            © 2025–2026 Bunda Journal<br />
            #111 / #FAFAF9 / 1px #E5E5E5 / 8px
          </div>
        </div>
      </footer>

      {/* MODAL PREVIEW CONTOH BUKU (PDF / POLAROID) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[640px] rounded-[8px] bg-white border border-[#E5E5E5] shadow-[0_24px_64px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Modal Header */}
            <div className="h-[44px] border-b border-[#E5E5E5] flex items-center justify-between px-4 bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                <span className="ml-3 text-[11px] text-[#999] font-mono">bunda-jurnal-preview.pdf</span>
              </div>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-6 h-6 rounded-[6px] hover:bg-stone-200 border border-transparent hover:border-[#E5E5E5] flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Book Spread Preview */}
                <div>
                  <div className="aspect-[3/4] rounded-[8px] border border-[#E5E5E5] bg-[#FAFAF9] p-4 flex flex-col shadow-sm">
                    <div className="serif text-[20px] leading-[1.1] text-[#111]">
                      Minggu 37 — <br />
                      Lemon 🍋
                    </div>
                    <div className="mt-4 flex-1 rounded-[6px] bg-white border border-[#E5E5E5] p-3 shadow-2xs">
                      <div className="text-[10px] text-[#999] tracking-widest mb-2 font-mono">
                        USG 4D • 5.4CM • P50
                      </div>
                      <div className="aspect-[4/3] bg-[#111] rounded-[4px] relative overflow-hidden flex items-center justify-center">
                        <div 
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: "repeating-linear-gradient(90deg, white 0 1px, transparent 1px 8px)"
                          }}
                        />
                        <span className="text-2xl animate-pulse">🍋</span>
                      </div>
                      <div className="mt-3 text-[11px] leading-[1.5] text-[#666]">
                        Hari ini detak 142 bpm. Ayah bilang mirip kamu waktu deg-degan nunggu hasil USG pertama.
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 h-[28px] rounded-[6px] bg-[#111] text-white flex items-center justify-center gap-1.5 text-[10px] font-medium">
                        <Mic className="w-3 h-3" /> Voice QR
                      </div>
                      <div className="w-[28px] h-[28px] rounded-[6px] border border-[#E5E5E5] bg-white grid grid-cols-3 gap-[1px] p-1">
                        <div className="bg-[#111]" /><div className="bg-white" /><div className="bg-[#111]" />
                        <div className="bg-[#111]" /><div className="bg-[#111]" /><div className="bg-white" />
                        <div className="bg-white" /><div className="bg-[#111]" /><div className="bg-[#111]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanations */}
                <div>
                  <div className="text-[11px] tracking-[0.08em] text-[#999] mb-3 font-medium">
                    APA ISINYA?
                  </div>
                  <h3 className="serif text-[20px] leading-[1.1] mb-4 text-[#111]">
                    Bukan template kosong. Sudah ada cerita 5.4cm lemon.
                  </h3>
                  <ul className="space-y-3 text-[13px] text-[#666]">
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-center justify-center text-[11px] font-semibold text-[#111] shrink-0">
                        1
                      </span>
                      Halaman WHO P10-P50-P90 dengan posisi janin
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-center justify-center text-[11px] font-semibold text-[#111] shrink-0">
                        2
                      </span>
                      Foto USG polaroid + QR 2×2cm suara detak
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E5] flex items-center justify-center text-[11px] font-semibold text-[#111] shrink-0">
                        3
                      </span>
                      3 Rings jasmani & catatan air 1.5/2.0L
                    </li>
                  </ul>

                  <div className="mt-6 p-3 rounded-[8px] bg-[#FAFAF9] border border-[#E5E5E5] text-[11px] leading-[1.5] text-[#666]">
                    Contoh asli dari Ibu Sari W37 di Bekasi. 100 halaman jadi buku A5 linen 12 menit cetak.
                  </div>

                  <button 
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      onEnterApp();
                    }}
                    className="mt-6 w-full h-[40px] rounded-[8px] bg-[#111] text-white text-[13px] font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    Buat versi kamu — Rp129rb
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// trigger rebuild Pages logo h-10 md:h-12
