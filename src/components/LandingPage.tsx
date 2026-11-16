import React, { useState, useRef } from 'react';
import { PAYMENT_PAUSED } from '../config/payments';
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
  Apple,
  MessageCircle,
  Palette,
  LogIn
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onStartCheckout?: (amount?: number) => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  isPaid?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onStartCheckout, onLoginClick, onRegisterClick, isPaid = false }) => {
  const [isPaidPreview, setIsPaidPreview] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shotPreview, setShotPreview] = useState<{ src: string; full?: string; title: string } | null>(null);

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
            <button
              type="button"
              onClick={onEnterApp}
              aria-label="Bunda Journal — buka aplikasi"
              className="cursor-pointer bg-transparent border-0 p-0"
            >
              <img src="/bunda_journal_FINAL_BIG.png" alt="Bunda Journal" className="h-12 md:h-14 w-auto" />
            </button>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-daftar-header"
              onClick={() => { if (onRegisterClick) onRegisterClick(); else if (onLoginClick) onLoginClick(); else onEnterApp(); }}
              className="h-[32px] px-3 rounded-[8px] text-[13px] font-medium text-[#666] hover:text-[#111] hover:bg-[#111]/5 transition-all cursor-pointer"
            >
              Daftar
            </button>
            <button
              type="button"
              id="btn-masuk-header"
              onClick={() => { if (onLoginClick) onLoginClick(); else onEnterApp(); }}
              className="h-[34px] px-4 rounded-[8px] border border-[#111] text-[13px] font-semibold text-[#111] hover:bg-[#111] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </button>
            <button 
              onClick={isPaid ? onEnterApp : () => {
                if (onStartCheckout) {
                  onStartCheckout(129000);
                } else {
                  onEnterApp();
                }
              }}
              disabled={!isPaid && PAYMENT_PAUSED}
              title={!isPaid && PAYMENT_PAUSED ? 'Pembayaran sedang diperbaiki' : undefined}
              className="h-[32px] px-4 rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] font-medium hover:bg-[#111] hover:text-white hover:border-[#111] transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#111] disabled:hover:border-[#E5E5E5]"
            >
              {isPaid ? 'Buka Aplikasi' : PAYMENT_PAUSED ? 'VIP Segera Hadir' : 'Miliki VIP 129rb'}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 h-[36px] rounded-[8px] bg-[#111] text-white text-[12px] font-medium flex items-center shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10 animate-fade-in">
          {toastMessage}
        </div>
      )}

      <main>
      {/* SECTION 1: HERO */}
      <section className="max-w-[1120px] mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-8 items-start">
          <div className="max-w-[520px]">
            <div className="inline-flex items-center gap-2 h-[24px] px-2.5 rounded-[8px] border border-[#E5E5E5] bg-white text-[11px] tracking-wide text-[#666] mb-6 shadow-2xs">
              <span className="w-[4px] h-[4px] rounded-full bg-[#111] animate-pulse" />
              100 HALAMAN A4 • 5 TEMA
            </div>

            <h1 className="serif text-[32px] md:text-[44px] leading-[0.95] tracking-[-0.03em] font-normal mb-5 text-[#111]">
              USG di galeri HP, <br />
              <span className="italic">jadi buku yang dibaca anak nanti</span>
            </h1>

            <p className="text-[14px] leading-[1.6] text-[#666] mb-8 max-w-[420px]">
              100 halaman A4, cerita harian, ringkasan mingguan, dan hasil cetak yang bisa dipegang. Data tersimpan di HP Bunda; backup opsional ke Google Drive sendiri. Sekali bayar, tanpa langganan.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <button 
                onClick={onStartCheckout ? () => onStartCheckout(129000) : onEnterApp}
                disabled={PAYMENT_PAUSED}
                title={PAYMENT_PAUSED ? 'Pembayaran sedang diperbaiki' : undefined}
                className="h-[40px] px-5 rounded-[8px] bg-[#111] text-white text-[13px] font-medium flex items-center gap-2 hover:bg-black transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#111]"
              >
                {PAYMENT_PAUSED ? 'VIP Segera Hadir' : 'Miliki VIP — Rp 129rb'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsPreviewModalOpen(true)}
                className="h-[40px] px-5 rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] font-medium hover:border-[#111] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5" /> Lihat Contoh
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-[#E5E5E5]">
              {['Data tersimpan di HP Bunda', 'Tanpa langganan', 'Backup ke Drive sendiri'].map((item) => (
                <span
                  key={item}
                  className="text-[11px] text-[#444] bg-white border border-[#E5E5E5] rounded-full px-2.5 py-1 shadow-2xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Visual: screenshot asli aplikasi */}
          <div className="relative md:ml-auto w-full max-w-[290px] mx-auto md:mx-0">
            <div className="rounded-[38px] border-[9px] border-[#111] bg-[#111] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)] overflow-hidden aspect-[9/17]">
              <img src="/landing/beranda.png" alt="Tampilan Beranda Bunda Journal" className="w-full h-full object-cover object-top" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#E5E5E5] rounded-full px-3 py-1 text-[10px] text-[#666] shadow-sm whitespace-nowrap">
              Tampilan asli aplikasi
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SCREENSHOT APP */}
      <section className="border-y border-[#E5E5E5] bg-white">
        <div className="max-w-[1120px] mx-auto px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-[560px] mb-10">
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-3 font-medium">LIHAT APP-NYA</div>
            <h2 className="serif text-[28px] md:text-[36px] leading-[1.05] tracking-[-0.02em] text-[#111] mb-3">
              Ini yang Bunda lihat setiap hari.
            </h2>
            <p className="text-[14px] leading-[1.6] text-[#666]">
              Bukan mockup. Tiga layar di bawah diambil langsung dari aplikasi: ringkasan mingguan, jurnal harian, dan halaman buku 100 halaman A4.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/landing/cerita-card.png', title: 'Ringkasan mingguan', desc: 'Ritme, streak, dan momen yang Bunda tulis.' },
              { src: '/landing/catatan-card.png', title: 'Jurnal harian', desc: 'Catatan, suasana hati, dan batas 160 karakter agar muat di buku.' },
              { src: '/landing/buku-card.png', title: 'Buku 100 halaman', desc: 'Halaman A4, lengkap dengan pemantauan minggu. Ketuk untuk memperbesar.' },
            ].map((shot) => (
              <figure key={shot.title} className="bg-[#FAFAF9] border border-[#E5E5E5] rounded-[14px] p-4">
                <button
                  type="button"
                  onClick={() => setShotPreview({ src: shot.src, full: (shot as any).full, title: shot.title })}
                  className="block w-full rounded-[10px] overflow-hidden border border-[#E5E5E5] bg-white cursor-zoom-in group relative"
                  aria-label={"Perbesar: " + shot.title}
                >
                  <img src={shot.src} alt={shot.title} className="w-full block object-cover object-top aspect-[4/5]" />
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Ketuk untuk memperbesar
                  </span>
                </button>
                <figcaption className="mt-3">
                  <div className="serif text-[15px] text-[#111]">{shot.title}</div>
                  <p className="text-[12px] text-[#666] leading-[1.5] mt-0.5">{shot.desc}</p>
                </figcaption>
              </figure>
            ))}
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
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
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
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
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
                <div className="text-[#6B6B6B]">Siap lahir kapan aja</div>
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
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
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

          {/* Card 4: Kirim jadwal ke Ayah */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
              JADWAL • KIRIM KE AYAH
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Jadwal kontrol jadi <br />
              kartu untuk Ayah
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Isi sekali. Kartu berisi tanggal, dokter, dan pesan Bunda siap dikirim lewat WhatsApp.
            </p>
            <div className="mt-auto flex items-center gap-2 h-[32px] px-2.5 rounded-[6px] bg-[#25D366] text-[#0B2E1E]">
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px]">Kirim ke Ayah</span>
            </div>
          </div>

          {/* Card 5: 5 tema buku */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Palette className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
              5 TEMA • PREVIEW = CETAK
            </div>
            <div className="serif text-[18px] leading-[1.1] mb-2 text-[#111]">
              Pilih tema, <br />
              buku tetap rapi
            </div>
            <p className="text-[12px] leading-[1.5] text-[#666] mb-4">
              Lima palet warna siap pakai. Yang Bunda lihat di aplikasi sama dengan hasil PDF-nya.
            </p>
            <div className="mt-auto flex items-center gap-2">
              {['#556B2F', '#B85D43', '#A85B73', '#262626', '#365345'].map((c) => (
                <span key={c} className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Card 6: Suplemen & Air */}
          <div className="bg-white p-6 min-h-[200px] flex flex-col">
            <div className="w-8 h-8 rounded-[8px] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111]">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-2 font-medium">
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
              <div className="flex justify-between text-[10px] text-[#6B6B6B] mb-1">
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
                Bukan langganan. File PDF milikmu selamanya, bisa dicetak di percetakan terdekat.
              </p>
            </div>

            {/* Live Toggle Simulation (Sebelum Bayar vs Setelah Bayar) */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className={!isPaidPreview ? "text-[#111] font-medium" : "text-[#6B6B6B]"}>
                Sebelum bayar
              </span>
              <button 
                type="button"
                role="switch"
                aria-checked={isPaidPreview}
                aria-label="Pratinjau tampilan setelah bayar"
                onClick={() => setIsPaidPreview(!isPaidPreview)}
                className={`relative w-[36px] h-[20px] rounded-full transition-colors cursor-pointer ${isPaidPreview ? "bg-[#111]" : "bg-[#E5E5E5]"}`}
              >
                <span 
                  aria-hidden="true"
                  className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all ${isPaidPreview ? "left-[18px]" : "left-[2px]"}`}
                />
              </button>
              <span className={isPaidPreview ? "text-[#111] font-medium" : "text-[#6B6B6B]"}>
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
                <div className="text-[12px] text-white/60 mb-6">Sekali bayar, tanpa langganan</div>
                <ul className="space-y-3 text-[13px] mb-8 text-white/90">
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span><b className="font-semibold text-white">100 halaman</b> buku kenangan digital</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span><b className="font-semibold text-white">5 tema buku</b>, semua ikut tercetak</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Arsip catatan dokter & jadwal kontrol</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Grafik pertumbuhan WHO P10-P50-P90</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-white" />
                    <span>Ekspor PDF A4 & siap cetak</span>
                  </li>
                </ul>
                <button 
                  onClick={onStartCheckout ? () => onStartCheckout(129000) : onEnterApp}
                  disabled={PAYMENT_PAUSED}
                  title={PAYMENT_PAUSED ? 'Pembayaran sedang diperbaiki' : undefined}
                  className="mt-auto h-[44px] rounded-[8px] bg-white text-[#111] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#FAFAF9] transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  {PAYMENT_PAUSED ? 'VIP Segera Hadir' : 'Miliki VIP — Rp 129rb'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="mt-3 text-[10px] text-white/50 text-center">
                  Bayar sekali seumur hidup, bukan langganan
                </div>
              </div>

              {/* Plan 2: Hardcover Cetak Fisik */}
              <div className="bg-white p-6 md:p-8 flex flex-col rounded-[11px]">
                <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-3 flex items-center gap-2 font-medium">
                  <span>HARDCOVER CETAK FISIK</span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#556B2F]/10 text-[#556B2F] font-bold text-[9px]">
                    FISIK
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="serif text-[32px] md:text-[36px] leading-none text-[#111]">Rp249rb</span>
                  <span className="text-[12px] text-[#6B6B6B]">cetak + kirim</span>
                </div>
                <div className="text-[12px] text-[#666] mb-6">Buku cetak fisik 100 halaman A4</div>
                <ul className="space-y-3 text-[13px] text-[#444] mb-8">
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span><b>Semua fitur VIP Digital Lengkap</b></span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#556B2F]" />
                    <span>100 halaman A4, art paper</span>
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
                  disabled={PAYMENT_PAUSED}
                  title={PAYMENT_PAUSED ? 'Pembayaran sedang diperbaiki' : undefined}
                  className="mt-auto h-[44px] rounded-[8px] border border-[#556B2F] text-[#556B2F] bg-white text-[13px] font-semibold hover:bg-[#556B2F] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#556B2F]"
                >
                  {PAYMENT_PAUSED ? 'Cetak Fisik Segera Hadir' : 'Pesan Cetak Fisik — Rp 249rb'}
                </button>
                <div className="mt-3 text-[10px] text-stone-600 text-center">
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
                    Sekali bayar, tanpa tagihan tahunan. 100 halaman siap diisi, langsung dari HP Bunda.
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
                      <Check className="w-3.5 h-3.5" /> 5 tema buku
                    </div>
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="w-3.5 h-3.5" /> Jadwal kontrol
                    </div>
                  </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-white p-6 flex flex-col justify-center gap-4 border-l border-emerald-100">
                  <div className="rounded-[8px] border border-[#E5E5E5] p-4 bg-[#FAFAF9]">
                    <div className="text-[11px] text-[#6B6B6B] mb-1 font-medium">INVOICE PEMBAYARAN</div>
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
      </main>

      {/* FOOTER */}
      <footer className="max-w-[1120px] mx-auto px-6 md:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="serif text-[20px] font-normal text-[#111]">bunda.</div>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#6B6B6B] max-w-[280px]">
              Jurnal kehamilan untuk Bunda yang ingin menyimpan kenangan. Dibuat offline-first, tanpa langganan.
            </div>
          </div>

          <div className="flex gap-12 text-[12px]">
            <div>
              <div className="font-medium mb-3 text-[#111]">Produk</div>
              <div className="space-y-2 text-[#666]">
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Jurnal</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Studio Cetak</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={onEnterApp}>Buku A4</div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-3 text-[#111]">Bantuan</div>
              <div className="space-y-2 text-[#666]">
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Format standar A5 Linen 100 halaman")}>Cara cetak</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Hubungi Tim CS: support@bundajournal.my.id")}>WhatsApp CS</div>
                <div className="hover:text-[#111] cursor-pointer" onClick={() => showToast("Data aman tersimpan di HP Bunda")}>FAQ Warisan</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#6B6B6B]">
            © 2026 BUN - Bunda Journal<br />
            support@bundajournal.my.id<br />
            Midtrans: GoPay QRIS, Bank Transfer VA, GoPay eMoney, BSI VA - HTTPS Secured
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[#EDE8DF] flex flex-wrap gap-4 justify-center text-[13px]" style={{ fontFamily: "Inter,sans-serif" }}>
          <a href="/about.html" className="text-[#5A6E4A] hover:underline">Tentang Kami</a>
          <span className="text-[#CCC]">•</span>
          <a href="/contact.html" className="text-[#5A6E4A] hover:underline">Kontak</a>
          <span className="text-[#CCC]">•</span>
          <a href="/terms.html" className="text-[#5A6E4A] hover:underline">Syarat &amp; Ketentuan</a>
          <span className="text-[#CCC]">•</span>
          <a href="/privacy.html" className="text-[#5A6E4A] hover:underline">Kebijakan Privasi</a>
          <span className="text-[#CCC]">•</span>
          <a href="/refund.html" className="text-[#5A6E4A] hover:underline">Kebijakan Refund</a>
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
                <span className="ml-3 text-[11px] text-[#6B6B6B] font-mono">bunda-jurnal-preview.pdf</span>
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
                      <div className="text-[10px] text-[#6B6B6B] tracking-widest mb-2 font-mono">
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
                        <Mic className="w-3 h-3" /> Buku A4
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
                  <div className="text-[11px] tracking-[0.08em] text-[#6B6B6B] mb-3 font-medium">
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
      {/* Lightbox screenshot */}
      {shotPreview && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setShotPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setShotPreview(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <figure className="max-w-[96vw] max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="max-h-[84vh] overflow-auto rounded-[10px] bg-white shadow-2xl w-full flex justify-start md:justify-center">
              <img
                src={shotPreview.full || shotPreview.src}
                alt={shotPreview.title}
                className="w-[860px] max-w-none md:w-auto md:max-w-[80vw] h-auto block"
              />
            </div>
            <figcaption className="text-white/80 text-[12px]">{shotPreview.title}</figcaption>
          </figure>
        </div>
      )}

    </div>
  );
};
// trigger rebuild Pages logo h-10 md:h-12
// trigger rebuild Pages logo h-10 md:h-12
