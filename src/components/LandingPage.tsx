import React from 'react';
import { ArrowRight, Droplets, Heart, Shield, BookOpen, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F6] text-[#292524] overflow-y-auto no-scrollbar pb-10">
      {/* Top Bar */}
      <nav className="p-6 flex items-center justify-between border-b border-stone-200/40">
        <span className="font-serif text-3xl font-bold tracking-tight text-[#292524]">bunda.</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#556B2F]/10 text-[#556B2F] font-semibold px-3 py-1 rounded-full">
            Kinfolk Edition
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-5 pb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-200/60 rounded-full text-[11px] font-medium text-stone-700 mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
          <span>Jurnal Kehamilan Offline-First & Buku Kenangan</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl leading-[1.25] text-[#292524] font-bold mb-3">
          Abadikan Perjalanan <br />
          <span className="italic text-[#C87A64]">9 Bulan yang Magis.</span>
        </h1>

        <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed mb-6 font-light">
          Jurnal digital estetik yang tersimpan aman di perangkat Anda tanpa kuota, dengan opsi sekali-klik cetak buku kenangan hardcover bersampul kain linen.
        </p>

        {/* Mockup / Visual Card */}
        <div className="relative mx-auto max-w-[320px] bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-stone-200/60 mb-7 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#C87A64]/15 flex items-center justify-center text-[#C87A64]">
                <Heart className="w-3.5 h-3.5 fill-[#C87A64]" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-stone-800">Minggu ke-12</p>
                <p className="text-[9px] text-stone-400">Si kecil seukuran Buah Lemon 🍋</p>
              </div>
            </div>
            <span className="text-[10px] text-[#556B2F] font-semibold bg-[#556B2F]/10 px-2 py-0.5 rounded-full">Trimester 1</span>
          </div>

          <div className="h-28 rounded-2xl bg-[#F5F2EB] flex flex-col items-center justify-center text-center p-3 border border-stone-200/40">
            <span className="text-3xl mb-1 animate-pulse">🍋</span>
            <p className="font-serif italic text-xs text-stone-700 leading-snug">
              "Wajah manismu mulai terbentuk anggun dalam keheningan rahim bunda..."
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <span className="flex items-center gap-1">💧 Air 2L Terpenuhi</span>
            <span className="flex items-center gap-1">💊 Vitamin Rutin</span>
            <span className="text-[#C87A64] font-semibold">Tersimpan</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="max-w-xs mx-auto">
          <button 
            onClick={onEnterApp}
            className="w-full py-4 px-6 rounded-full bg-[#556B2F] text-white font-medium text-sm tracking-wide shadow-[0_10px_25px_rgba(85,107,47,0.25)] hover:bg-[#465926] active:scale-98 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Miliki Sekarang - Rp 49.000</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[11px] text-stone-500 mt-2 font-light">
            Sekali bayar seumur hidup • Akses instan langsung pakai
          </p>
        </div>
      </section>

      {/* 3 Features Elegant Grid */}
      <section className="px-6 py-6 border-t border-stone-200/60 bg-[#FAF9F7]">
        <h2 className="font-serif text-xl text-center font-semibold mb-5 text-stone-800">
          Dirancang Penuh Cinta untuk Bunda
        </h2>

        <div className="space-y-3.5">
          {/* Feature 1 */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200/50 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F] shrink-0 mt-0.5">
              <Droplets className="w-5 h-5 fill-[#556B2F]/30" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-800 mb-0.5">Daily Habit & Mood Tracker</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-light">
                Pantau asupan air 2L, asam folat, jalan santai, hingga suasana hati dengan sentuhan lembut setiap pagi.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200/50 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C87A64]/10 flex items-center justify-center text-[#C87A64] shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-800 mb-0.5">100% Privat & Tanpa Kuota</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-light">
                Arsitektur Local-First menyimpan foto perut dan USG langsung di memori HP Anda. Bebas buka di mana saja.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200/50 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-800 mb-0.5">Eksport Buku Cetak Linen</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-light">
                Saat si kecil lahir, seluruh riwayat tulisan dan fotomu dapat dicetak menjadi buku kenangan fisik berkualitas museum.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Quick Trigger */}
        <div className="mt-8 text-center">
          <button 
            onClick={onEnterApp}
            className="text-xs font-semibold text-[#556B2F] underline underline-offset-4 hover:text-[#465926] transition-colors cursor-pointer"
          >
            Sudah punya akses? Buka Jurnal Saya &rarr;
          </button>
        </div>
      </section>
    </div>
  );
};
