import React, { useState } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';
import { UserProfile } from '../../../types';

interface IntroPagesProps {
  theme: BookThemeConfig;
  userProfile: UserProfile;
  isFillMode?: boolean;
}

export const IntroPages: React.FC<IntroPagesProps> = ({ theme, userProfile, isFillMode = true }) => {
  const [ownerName, setOwnerName] = useState(userProfile.name || '');
  const [hplText, setHplText] = useState(userProfile.hplDate || '');

  return (
    <div className="flex flex-row items-center justify-center gap-0 w-full print:gap-0 print:block">
      {/* ============================================================== */}
      {/* HALAMAN 1: HALAMAN JUDUL UTAMA (COVER DALAM)                  */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-between items-center text-center py-4 sm:py-6 border-4 border-double" style={{ borderColor: theme.borderColor }}>
          {/* Top Label */}
          <div className="pt-4 sm:pt-6">
            <span className="text-[9.5px] uppercase tracking-[0.25em] font-sans text-stone-500 block mb-2">
              Jurnal Kehamilan & Buku Kenangan 100 Halaman
            </span>
            <div className="w-10 h-0.5 mx-auto" style={{ backgroundColor: theme.primaryColor }} />
          </div>

          {/* Main Title Lockup */}
          <div className="my-auto px-4 sm:px-6">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight mb-2 sm:mb-3" style={{ color: theme.textColor }}>
              bunda.
            </h1>
            <p className="font-serif italic text-base sm:text-lg md:text-xl font-light mb-3 sm:mb-4" style={{ color: theme.secondaryColor }}>
              Abadikan Perjalanan 9 Bulan yang Magis
            </p>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed font-light">
              Catatan cinta, detak rasa, dan untaian doa dari setiap minggu penantian terindah sang buah hati.
            </p>
          </div>

          {/* Dedicated To / Mother Info - Editable */}
          <div className="w-full max-w-xs px-4 pb-4 sm:pb-6 space-y-2">
            <div className="border-t border-stone-300 pt-2 text-[9.5px] text-stone-500 uppercase tracking-widest font-sans">
              Buku Milik:
            </div>
            <div className="border-b border-stone-400 pb-0.5 text-center">
              <input 
                type="text"
                placeholder="Nama Bunda"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full text-center font-serif text-base sm:text-lg font-bold bg-transparent focus:outline-hidden"
                style={{ color: theme.textColor }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-stone-500 font-sans pt-1">
              <div className="flex items-center gap-1">
                <span>HPL:</span>
                <input 
                  type="text"
                  placeholder="Tanggal HPL"
                  value={hplText}
                  onChange={(e) => setHplText(e.target.value)}
                  className="w-24 text-[9px] font-sans font-medium bg-transparent border-b border-stone-300 focus:outline-hidden"
                />
              </div>
              <span>Edisi Koleksi B5</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HALAMAN 2: KATA PENGANTAR & PETUNJUK MENULIS                  */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3 sm:mb-4" style={{ borderColor: theme.textColor }}>
              <span className="text-[8.5px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                Prakata
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold" style={{ color: theme.textColor }}>
                Surat Pembuka untuk Malaikat Kecilku
              </h2>
            </div>

            {/* Letter Body */}
            <div 
              className="p-3 sm:p-4 bg-white/70 border rounded-xs text-[10.5px] sm:text-[11px] font-serif leading-relaxed italic text-stone-700 space-y-2 mb-3 sm:mb-4"
              style={{ borderColor: theme.borderColor }}
            >
              <p>
                "Untukmu, buah hati tercinta yang detak jantung pertamanya telah menggetarkan seisi semesta jiwa ayah dan bunda...
              </p>
              <p>
                Buku ini adalah saksi bisu dari setiap tetes rasa syukur, kecemasan manis, doa di sepertiga malam, hingga tendangan-tendangan lembut yang kelak akan bunda rindukan. Setiap halaman bergaris di sini dirancang khusus untuk menyimpan perjalanan 40 minggu kita bersama.
              </p>
              <p>
                Saat kamu dewasa nanti dan membaca lembar demi lembar buku ini, ketahuilah bahwa kamu telah sangat dicintai, bahkan jauh sebelum kami menatap wajah manismu."
              </p>
              <div className="pt-1.5 text-right not-italic font-sans text-[10px] text-stone-500">
                Penuh cinta, <br />
                <span className="font-serif font-bold text-xs" style={{ color: theme.primaryColor }}>
                  {ownerName || 'Bunda & Ayah'}
                </span>
              </div>
            </div>

            {/* Guide */}
            <div 
              className="border p-2.5 sm:p-3 rounded-xs"
              style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}
            >
              <h4 className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.primaryColor }}>
                Panduan Pengisian Buku Jurnal:
              </h4>
              <ul className="text-[8.5px] sm:text-[9px] text-stone-600 space-y-1 font-light">
                <li>• <strong>Bab 1 (Hal 3-6)</strong>: Foto test pack perdana, reaksi ayah, & USG awal.</li>
                <li>• <strong>Bab 2 (Hal 9-84)</strong>: 36 minggu x 2 halaman (Halaman kiri tracker, mood, tidur; Halaman kanan foto perut / USG).</li>
                <li>• <strong>Bab 3 (Hal 85-90)</strong>: Ide nama anak, belanja bayi, & tas bersalin RS.</li>
                <li>• <strong>Bab 4 & 5 (Hal 91-100)</strong>: Kelahiran, cap kaki, & surat kapsul waktu 17 tahun.</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Pengantar</span>
            <span>2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
